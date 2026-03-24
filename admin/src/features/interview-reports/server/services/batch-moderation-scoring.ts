import "server-only";

import { generateObject } from "ai";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { moderationResultSchema } from "../../shared/schemas";
import { buildModerationPrompt } from "../../shared/utils/build-moderation-prompt";
import { parseOpinions } from "../../shared/utils/parse-opinions";
import {
  findInterviewMessagesBySessionId,
  findReportsWithoutModerationScore,
  updateModerationScore,
} from "../repositories/interview-report-repository";

type BatchModerationResult = {
  total: number;
  processed: number;
  failed: number;
};

/**
 * moderation_score が未設定の既存レポートに対してモデレーション評価を実行する
 */
export async function runBatchModerationScoring(): Promise<BatchModerationResult> {
  const reports = await findReportsWithoutModerationScore();
  const result: BatchModerationResult = {
    total: reports.length,
    processed: 0,
    failed: 0,
  };

  for (const report of reports) {
    try {
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

      await updateModerationScore(report.id, object.score);

      console.log(
        `[BatchModeration] report=${report.id} score=${object.score} categories=[${object.flagged_categories.join(",")}]`
      );

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
