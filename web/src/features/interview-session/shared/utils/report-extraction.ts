import {
  type InterviewReportData,
  interviewChatWithReportSchema,
  interviewStageSchema,
} from "../schemas";

// DB保存済みメッセージの後方互換（next_stageがない旧形式も許容）
const reportParseSchema = interviewChatWithReportSchema.extend({
  next_stage: interviewStageSchema.optional(),
});

/**
 * メッセージからレポートを抽出する
 */
export function extractReportFromMessage(
  content: string
): InterviewReportData | null {
  try {
    const parsed = JSON.parse(content);
    const result = reportParseSchema.safeParse(parsed);
    if (result.success) {
      return result.data.report;
    }
  } catch (e) {
    // JSONでない場合は無視
    console.error("Failed to parse report from message content", content, e);
  }
  return null;
}
