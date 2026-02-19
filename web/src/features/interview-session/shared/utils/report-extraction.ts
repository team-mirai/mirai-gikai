import {
  type InterviewReportData,
  interviewChatWithReportSchema,
} from "../schemas";

/**
 * メッセージからレポートを抽出する
 */
export function extractReportFromMessage(
  content: string
): InterviewReportData | null {
  try {
    const parsed = JSON.parse(content);
    const result = interviewChatWithReportSchema.safeParse(parsed);
    if (result.success) {
      return result.data.report;
    }
  } catch (e) {
    // JSONでない場合は無視
    console.error("Failed to parse report from message content", content, e);
  }
  return null;
}
