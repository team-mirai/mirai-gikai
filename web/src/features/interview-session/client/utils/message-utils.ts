import type { InterviewReportViewData } from "../../shared/schemas";
import type { SimpleMessage } from "../../shared/types";
import { isValidReport, parseMessageContent } from "../../shared/message-utils";

// Re-export from shared for backwards compatibility
export { isValidReport, parseMessageContent };

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
          { title?: string; content?: string } | undefined
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

/**
 * メッセージ配列をAPI送信用の形式に変換
 */
export function buildMessagesForApi(
  initialMessages: Array<{ role: "assistant" | "user"; content: string }>,
  conversationMessages: Array<{ role: "assistant" | "user"; content: string }>,
  newUserMessage?: string
): Array<{ role: "assistant" | "user"; content: string }> {
  const messages = [
    ...initialMessages.map((m) => ({ role: m.role, content: m.content })),
    ...conversationMessages.map((m) => ({ role: m.role, content: m.content })),
  ];

  if (newUserMessage) {
    messages.push({ role: "user" as const, content: newUserMessage });
  }

  return messages;
}

// Re-export from shared for backwards compatibility
export type { SimpleMessage };

/**
 * メッセージ配列をファシリテーターAPI用の形式に変換
 */
export function buildMessagesForFacilitator(
  initialMessages: Array<{ role: "assistant" | "user"; content: string }>,
  conversationMessages: Array<{ role: "assistant" | "user"; content: string }>,
  newUserMessage: { content: string }
): SimpleMessage[] {
  return [
    ...initialMessages.map((m) => ({ role: m.role, content: m.content })),
    ...conversationMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: newUserMessage.content },
  ];
}
