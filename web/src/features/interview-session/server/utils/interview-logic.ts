import "server-only";

import { parseMessageContent } from "../../shared/message-utils";

/**
 * すでに聞いた質問IDを収集する
 */
export function collectAskedQuestionIds(
  messages: Array<{ role: string; content: string }>
): Set<string> {
  const askedQuestionIds = new Set<string>();
  for (const m of messages) {
    if (m.role === "assistant") {
      const { questionId } = parseMessageContent(m.content);
      if (questionId) {
        askedQuestionIds.add(questionId);
      }
    }
  }
  return askedQuestionIds;
}
