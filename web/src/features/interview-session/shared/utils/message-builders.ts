import type { SimpleMessage } from "../types";

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
