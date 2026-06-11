import { buildSummarySystemPrompt } from "@mirai-gikai/shared/interview-prompts/summary";
import type { PromptBillInput } from "@mirai-gikai/shared/interview-prompts/types";
import { buildInterviewOpinionRows } from "@mirai-gikai/shared/interview-report/build-opinion-rows";
import { enrichOpinionsWithSourceContent } from "@mirai-gikai/shared/interview-report/enrich-opinions";
import {
  type InterviewReportData,
  interviewReportSchema,
} from "@mirai-gikai/shared/interview-report/schema";
import { syncInterviewOpinions } from "@mirai-gikai/shared/interview-report/sync-opinions";
import { generateObject } from "ai";
import {
  markReextractionAttempted,
  updateReportOpinions,
} from "../repositories/backfill-repository";
import {
  fetchBillWithContents,
  findInterviewConfigById,
  findInterviewMessagesBySessionId,
  findInterviewSessionById,
} from "../repositories/interview-repository";
import { OPINION_BACKFILL_MODEL } from "../shared/constants";
import type { BackfillTargetReport, ReextractResult } from "../shared/types";
import { prepareReextractionMessages } from "../utils/prepare-reextraction-messages";

/** 再抽出の生成ステップ（テストで Fake に差し替えられるよう DI 可能にする）。 */
export type GenerateReportFn = (params: {
  systemPrompt: string;
}) => Promise<InterviewReportData>;

const defaultGenerateReport: GenerateReportFn = async ({ systemPrompt }) => {
  const { object } = await generateObject({
    model: OPINION_BACKFILL_MODEL,
    schema: interviewReportSchema,
    prompt: systemPrompt,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "interview-opinion-backfill-reextract",
    },
  });
  return object;
};

/**
 * 1レポートの意見を新プロンプトで再抽出し、opinions だけを更新する。
 * summary/stance/role/content_richness/moderation/公開フラグは保持する。
 * 成功時は更新とともに、恒久的にスキップ（セッション/設定/メッセージ無し）の場合も
 * ウォーターマーク（opinions_reextracted_at）を進める。
 * ただし生成・更新・同期の失敗時は進めない（次回再実行で再試行される）。
 */
export async function reextractReportOpinions(
  target: BackfillTargetReport,
  deps: { generateReport?: GenerateReportFn } = {}
): Promise<ReextractResult> {
  const { reportId, sessionId } = target;
  const generateReport = deps.generateReport ?? defaultGenerateReport;
  const nowIso = new Date().toISOString();

  try {
    const session = await findInterviewSessionById(sessionId);
    if (!session) {
      await markReextractionAttempted(reportId, nowIso);
      return { reportId, status: "skipped", reason: "session not found" };
    }

    const [interviewConfig, messages] = await Promise.all([
      findInterviewConfigById(session.interview_config_id),
      findInterviewMessagesBySessionId(sessionId),
    ]);

    if (!interviewConfig) {
      await markReextractionAttempted(reportId, nowIso);
      return { reportId, status: "skipped", reason: "config not found" };
    }

    const chatMessages = prepareReextractionMessages(messages ?? []);
    if (chatMessages.length === 0) {
      await markReextractionAttempted(reportId, nowIso);
      return { reportId, status: "skipped", reason: "no chat messages" };
    }

    const billData = await fetchBillWithContents(interviewConfig.bill_id);
    const bill: PromptBillInput = {
      name: billData.bill.name,
      knowledge_source: billData.bill.knowledge_source ?? null,
      bill_content: {
        title: billData.billTitle,
        summary: billData.billSummary,
        content: billData.billContent,
      },
    };

    const systemPrompt = buildSummarySystemPrompt({
      bill,
      interviewConfig,
      messages: chatMessages,
    });

    const report = await generateReport({ systemPrompt });

    // source_message_id を元発言に解決し source_message_content を付与
    const enrichedOpinions = enrichOpinionsWithSourceContent(
      report.opinions,
      messages ?? []
    );

    // interview_opinion（正規化プロジェクション）を先に同期し、
    // 最後に opinions + ウォーターマークを書く。こうすることで
    // ウォーターマークが立つ = update と sync の両方が成功した状態のみとなり、
    // sync 失敗時に「opinions だけ更新されて projection が古いまま完了扱い」になるのを防ぐ。
    await syncInterviewOpinions(
      reportId,
      buildInterviewOpinionRows(reportId, enrichedOpinions)
    );
    await updateReportOpinions(reportId, enrichedOpinions, nowIso);

    return { reportId, status: "updated" };
  } catch (error) {
    // 生成・更新・同期の失敗はウォーターマークを進めない（= 次回再実行で再試行される）。
    // 恒久的に処理不能なケース（セッション/設定/メッセージ無し）のみ上の分岐で
    // markReextractionAttempted 済み。永続失敗による空回りは run 側の「前進ゼロで停止」で防ぐ。
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[OpinionBackfill] Failed to reextract report ${reportId}: ${reason}`
    );
    return { reportId, status: "failed", reason };
  }
}
