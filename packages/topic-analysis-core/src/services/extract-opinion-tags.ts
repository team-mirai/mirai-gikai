import {
  type OpinionTagsExtraction,
  opinionTagsExtractionSchema,
} from "@mirai-gikai/shared/interview-report/opinion-tags-schema";
import { generateObject } from "ai";
import {
  findUntaggedOpinions,
  markOpinionsTagAttempted,
  type TagTargetReport,
  updateOpinionTags,
} from "../repositories/opinion-tags-repository";
import {
  findBillNameById,
  findInterviewConfigById,
  findInterviewMessagesBySessionId,
  findInterviewSessionById,
} from "../repositories/interview-repository";
import {
  OPINION_TAG_MODEL,
  OPINION_TAG_TIMEOUT_MS,
} from "../shared/constants";
import { buildOpinionTagsPrompt } from "../utils/build-opinion-tags-prompt";
import { prepareReextractionMessages } from "../utils/prepare-reextraction-messages";
import { reconcileOpinionTags } from "../utils/reconcile-opinion-tags";

export type TagExtractionResult = {
  reportId: string;
  status: "updated" | "skipped" | "failed";
  /** タグを書き込んだ意見の件数。 */
  tagged?: number;
  reason?: string;
};

/** タグ生成ステップ（テストで Fake に差し替えられるよう DI 可能にする）。 */
export type GenerateTagsFn = (params: {
  prompt: string;
}) => Promise<OpinionTagsExtraction>;

function createDefaultGenerateTags(model: string): GenerateTagsFn {
  return async ({ prompt }) => {
    const { object } = await generateObject({
      model,
      schema: opinionTagsExtractionSchema,
      prompt,
      // 並列 CONCURRENCY 本のうち1本が返らないとウェーブ全体が止まり、
      // チャンクループごと Cloud Run Job のタイムアウトまで無為に待つため上限を明示する。
      abortSignal: AbortSignal.timeout(OPINION_TAG_TIMEOUT_MS),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "interview-opinion-tag-backfill",
      },
    });
    return object;
  };
}

/**
 * 1レポート分の意見に、タグ（concern / proposal / reasoning_types）だけを付ける。
 *
 * **意見の本文は再生成しない。** 既存の再抽出（reextractReportOpinions）はプロンプトごと
 * 意見を作り直すため、opinion_index に載る意見の中身が変わり、UUID を参照している
 * topic_opinion の割当が実質ずれる（公開中のトピック分析の引用が差し替わる）。
 * タグ付けは既存行の UPDATE のみで、本文・UUID・並び順を一切動かさない。
 *
 * 恒久的にスキップ（対象意見なし・セッション/設定/メッセージ無し）の場合も
 * ウォーターマークを進める。生成・更新の失敗時は進めない（次回再実行で再試行）。
 */
export async function extractOpinionTagsForReport(
  target: TagTargetReport,
  deps: { generateTags?: GenerateTagsFn; model?: string } = {}
): Promise<TagExtractionResult> {
  const { reportId, sessionId, role, roleTitle } = target;
  const generateTags =
    deps.generateTags ??
    createDefaultGenerateTags(deps.model ?? OPINION_TAG_MODEL);
  const nowIso = new Date().toISOString();

  try {
    const opinions = await findUntaggedOpinions(reportId);
    if (opinions.length === 0) {
      return { reportId, status: "skipped", reason: "no untagged opinions" };
    }
    const requestedIndexes = opinions.map((o) => o.opinion_index);

    const session = await findInterviewSessionById(sessionId);
    if (!session) {
      await markOpinionsTagAttempted(reportId, requestedIndexes, nowIso);
      return { reportId, status: "skipped", reason: "session not found" };
    }

    const [interviewConfig, messages] = await Promise.all([
      findInterviewConfigById(session.interview_config_id),
      findInterviewMessagesBySessionId(sessionId),
    ]);
    if (!interviewConfig) {
      await markOpinionsTagAttempted(reportId, requestedIndexes, nowIso);
      return { reportId, status: "skipped", reason: "config not found" };
    }

    // 発言原文が引けないと professional_expertise の判定材料が無く、
    // 根拠なしを焼き付けてしまうため再抽出側と同じく skip する。
    const chatMessages = prepareReextractionMessages(messages ?? []);
    if (chatMessages.length === 0) {
      await markOpinionsTagAttempted(reportId, requestedIndexes, nowIso);
      return { reportId, status: "skipped", reason: "no chat messages" };
    }

    const billName = await findBillNameById(interviewConfig.bill_id);
    if (!billName) {
      await markOpinionsTagAttempted(reportId, requestedIndexes, nowIso);
      return { reportId, status: "skipped", reason: "bill not found" };
    }

    const prompt = buildOpinionTagsPrompt({
      billName,
      role,
      roleTitle,
      opinions,
      messages: chatMessages,
    });

    const result = await generateTags({ prompt });
    const { updates, missingIndexes } = reconcileOpinionTags(
      requestedIndexes,
      result.tags
    );

    await updateOpinionTags(reportId, updates, nowIso);
    // LLM が返さなかった意見は次チャンクで滞留しないようウォーターマークだけ進める。
    if (missingIndexes.length > 0) {
      console.warn(
        `[OpinionTagBackfill] report ${reportId}: no tags returned for opinion_index=${missingIndexes.join(",")}`
      );
      await markOpinionsTagAttempted(reportId, missingIndexes, nowIso);
    }

    // 1件もタグが取れなかった実行を updated として集計すると、モデルが全件空振り
    // した回が「正常完了」に見えてしまう（ウォーターマークは進むので pending 再実行
    // でも拾えない）。空振りは failed として集計に出す。
    if (updates.length === 0) {
      return {
        reportId,
        status: "failed",
        tagged: 0,
        reason: "no tags returned for any opinion",
      };
    }

    return { reportId, status: "updated", tagged: updates.length };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[OpinionTagBackfill] Failed to tag report ${reportId}: ${reason}`
    );
    return { reportId, status: "failed", reason };
  }
}
