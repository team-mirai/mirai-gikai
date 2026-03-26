import "server-only";

import { generateObject } from "ai";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { moderationResultSchema } from "@mirai-gikai/shared/moderation/schemas";
import { buildModerationPrompt } from "@mirai-gikai/shared/moderation/build-prompt";
import { parseOpinions } from "../../shared/utils/parse-opinions";
import {
  findInterviewMessagesBySessionId,
  findReportForModerationScoringById,
  updateModerationScore,
} from "../repositories/interview-report-repository";

export type BatchModerationResult = {
  total: number;
  processed: number;
  failed: number;
};

const MODERATION_MAX_CONCURRENCY = 20;

/**
 * 単一レポートに対してモデレーション評価を実行する
 *
 * sessionId は report.interview_session_id から取得し、
 * クライアントからの入力には依存しない。
 */
export async function runSingleModerationScoring(
  reportId: string
): Promise<{ score: number }> {
  const report = await findReportForModerationScoringById(reportId);

  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }

  const messages = await findInterviewMessagesBySessionId(
    report.interview_session_id
  );

  const prompt = buildModerationPrompt({
    summary: report.summary,
    opinions: parseOpinions(report.opinions),
    roleDescription: report.role_description,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const { object } = await generateObject({
    model: DEFAULT_INTERVIEW_CHAT_MODEL,
    schema: moderationResultSchema,
    prompt,
  });

  await updateModerationScore(reportId, {
    score: object.score,
    reasoning: object.reasoning,
  });

  console.log(`[SingleModeration] report=${reportId} score=${object.score}`);

  return { score: object.score };
}

/**
 * 指定されたレポートIDリストに対してモデレーション評価を並列実行する
 *
 * MODERATION_MAX_CONCURRENCY 件ずつ並列処理し、全件完了後に結果を返す。
 */
export async function runBatchModerationScoringChunk(
  reportIds: string[]
): Promise<BatchModerationResult> {
  const result: BatchModerationResult = {
    total: reportIds.length,
    processed: 0,
    failed: 0,
  };

  for (let i = 0; i < reportIds.length; i += MODERATION_MAX_CONCURRENCY) {
    const concurrent = reportIds.slice(i, i + MODERATION_MAX_CONCURRENCY);
    const results = await Promise.allSettled(
      concurrent.map((id) => runSingleModerationScoring(id))
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        result.processed++;
      } else {
        result.failed++;
        console.error("[BatchModeration] Failed:", r.reason);
      }
    }
  }

  console.log(
    `[BatchModeration] Chunk complete: total=${result.total} processed=${result.processed} failed=${result.failed}`
  );

  return result;
}
