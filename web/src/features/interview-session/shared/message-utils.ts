import type { InterviewReportViewData } from "./schemas";

/**
 * レポートが有効かどうかを判定（空オブジェクトや全てnullの場合はfalse）
 */
export function isValidReport(
  report: InterviewReportViewData | null | undefined
): report is InterviewReportViewData {
  if (!report) return false;
  return !!(
    report.summary ||
    report.stance ||
    report.role ||
    report.role_description ||
    report.role_title ||
    report.opinions.length > 0
  );
}

/**
 * JSONとして保存されたメッセージをパースして、textとreportとquickRepliesに分離する
 */
export function parseMessageContent(content: string): {
  text: string;
  report: InterviewReportViewData | null;
  quickReplies: string[];
  questionId: string | null;
  topicTitle: string | null;
} {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null && "text" in parsed) {
      const questionId =
        typeof parsed.question_id === "string" && parsed.question_id
          ? parsed.question_id
          : typeof parsed.questionId === "string" && parsed.questionId
            ? parsed.questionId
            : null;
      const rawReport = parsed.report;
      const quickReplies =
        questionId && Array.isArray(parsed.quick_replies)
          ? parsed.quick_replies
          : [];
      const topicTitle =
        typeof parsed.topic_title === "string" && parsed.topic_title
          ? parsed.topic_title
          : null;

      if (rawReport) {
        // opinionsがnullの場合は空配列に変換（scoresは除外）
        const report: InterviewReportViewData = {
          summary: rawReport.summary ?? null,
          stance: rawReport.stance ?? null,
          role: rawReport.role ?? null,
          role_description: rawReport.role_description ?? null,
          role_title: rawReport.role_title ?? null,
          opinions: rawReport.opinions ?? [],
        };
        return {
          text: parsed.text ?? "",
          report: isValidReport(report) ? report : null,
          quickReplies,
          questionId,
          topicTitle,
        };
      }
      return {
        text: parsed.text ?? "",
        report: null,
        quickReplies,
        questionId,
        topicTitle,
      };
    }
  } catch {
    // JSONでない場合はそのままテキストとして扱う
  }
  return {
    text: content,
    report: null,
    quickReplies: [],
    questionId: null,
    topicTitle: null,
  };
}
