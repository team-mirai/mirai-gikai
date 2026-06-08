import type { InterviewReportViewData } from "../../shared/schemas";
import { isValidReport, parseMessageContent } from "../../shared/message-utils";

// Re-export from shared for backwards compatibility
export { isValidReport, parseMessageContent };
export { buildMessagesForApi } from "../../shared/utils/message-builders";

/**
 * 会話メッセージの型定義
 */
export type ConversationMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  report?: InterviewReportViewData | null;
  quickReplies?: string[];
  questionId?: string | null;
  topicTitle?: string | null;
};

/**
 * PartialObjectのレポートをInterviewReportViewDataに変換（表示用）
 */
export function convertPartialReport(
  partialReport:
    | {
        summary?: string | null;
        stance?: "for" | "against" | "neutral" | null;
        role?:
          | "subject_expert"
          | "work_related"
          | "daily_life_affected"
          | "general_citizen"
          | null;
        role_description?: string | null;
        role_title?: string | null;
        opinions?: Array<
          | {
              title?: string;
              content?: string;
              source_message_id?: string | null;
              contextual_quote?: string | null;
              bill_sentiment?: "期待" | "懸念" | null;
            }
          | undefined
        > | null;
      }
    | null
    | undefined
): InterviewReportViewData | null {
  if (!partialReport) return null;

  const opinions = partialReport.opinions
    ? partialReport.opinions
        .filter((op): op is NonNullable<typeof op> => op != null)
        .map((op) => ({
          title: op.title ?? "",
          content: op.content ?? "",
          source_message_id: op.source_message_id ?? null,
          contextual_quote: op.contextual_quote ?? null,
          bill_sentiment: op.bill_sentiment ?? null,
        }))
        .filter((op) => op.title || op.content)
    : [];

  const converted: InterviewReportViewData = {
    summary: partialReport.summary ?? null,
    stance: partialReport.stance ?? null,
    role: partialReport.role ?? null,
    role_description: partialReport.role_description ?? null,
    role_title: partialReport.role_title ?? null,
    opinions,
  };

  return isValidReport(converted) ? converted : null;
}
