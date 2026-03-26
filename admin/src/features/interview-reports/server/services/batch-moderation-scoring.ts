import "server-only";

import { generateObject } from "ai";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { moderationResultSchema } from "@mirai-gikai/shared/moderation/schemas";
import { buildModerationPrompt } from "@mirai-gikai/shared/moderation/build-prompt";
import { parseOpinions } from "../../shared/utils/parse-opinions";
import {
  findInterviewMessagesBySessionId,
  findReportForModerationScoringById,
  findReportsForModerationScoring,
  updateModerationScore,
} from "../repositories/interview-report-repository";

type BatchModerationResult = {
  total: number;
  processed: number;
  failed: number;
};

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
 * 全レポートに対してモデレーション評価を一括実行する
 */
export async function runBatchModerationScoring(): Promise<BatchModerationResult> {
  const reports = await findReportsForModerationScoring();
  const result: BatchModerationResult = {
    total: reports.length,
    processed: 0,
    failed: 0,
  };

  for (const report of reports) {
    try {
      await runSingleModerationScoring(report.id);
      result.processed++;
    } catch (error) {
      console.error(
        `[BatchModeration] Failed to process report ${report.id}:`,
        error
      );
      result.failed++;
    }
  }

  console.log(
    `[BatchModeration] Complete: total=${result.total} processed=${result.processed} failed=${result.failed}`
  );

  return result;
}
