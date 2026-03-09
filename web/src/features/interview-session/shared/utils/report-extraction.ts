import { z } from "zod";
import { type InterviewReportData, interviewReportSchema } from "../schemas";

/**
 * 保存済みメッセージからレポートを抽出するためのスキーマ
 * next_stageはレスポンス時のみ必要なため、抽出時は不要
 */
const reportExtractionSchema = z.object({
  text: z.string(),
  report: interviewReportSchema,
});

/**
 * メッセージからレポートを抽出する
 */
export function extractReportFromMessage(
  content: string
): InterviewReportData | null {
  try {
    const parsed = JSON.parse(content);
    const result = reportExtractionSchema.safeParse(parsed);
    if (result.success) {
      return result.data.report;
    }
  } catch (e) {
    // JSONでない場合は無視
    console.error("Failed to parse report from message content", content, e);
  }
  return null;
}
