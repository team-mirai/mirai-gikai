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
import { markReextractionAttempted } from "../repositories/backfill-repository";
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

/** 指定モデルで再抽出する既定の生成関数を作る。 */
function createDefaultGenerateReport(model: string): GenerateReportFn {
  return async ({ systemPrompt }) => {
    const { object } = await generateObject({
      model,
      schema: interviewReportSchema,
      prompt: systemPrompt,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "interview-opinion-backfill-reextract",
      },
    });
    return object;
  };
}

/**
 * 1レポートの意見を新プロンプトで再抽出し、**interview_opinion テーブルのみ**更新する。
 * interview_report.opinions(JSONB) は「ユーザーが確認した当時のレポート」の記録として
 * 書き換えない（再抽出はトピック分析用の意見だけを更新する）。summary/stance/role 等の
 * report カラムも保持する。
 * 成功時はテーブル同期に加えてウォーターマーク（opinions_reextracted_at）を進める。
 * 恒久的にスキップ（セッション/設定/メッセージ無し）の場合も進める。
 * ただし生成・同期の失敗時は進めない（次回再実行で再試行される）。
 */
export async function reextractReportOpinions(
  target: BackfillTargetReport,
  deps: { generateReport?: GenerateReportFn; model?: string } = {}
): Promise<ReextractResult> {
  const { reportId, sessionId } = target;
  const generateReport =
    deps.generateReport ??
    createDefaultGenerateReport(deps.model ?? OPINION_BACKFILL_MODEL);
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

    // source_message_id を元発言に解決して interview_opinion 行を作る。
    const enrichedOpinions = enrichOpinionsWithSourceContent(
      report.opinions,
      messages ?? []
    );

    // 再抽出は interview_opinion テーブルのみ更新する（JSONB は原本として書き換えない）。
    // テーブル同期に成功した場合だけウォーターマークを進める。こうすることで
    // 「同期は失敗したのに完了扱い」になるのを防ぐ（次回再実行で再試行される）。
    await syncInterviewOpinions(
      reportId,
      buildInterviewOpinionRows(reportId, enrichedOpinions)
    );
    await markReextractionAttempted(reportId, nowIso);

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
