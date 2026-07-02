import type { MatchedUserMessage, SessionMatchGroup } from "../types";

/**
 * created_at 降順のメッセージ一覧をセッションごとにまとめる。
 * セッションは最新の一致メッセージが新しい順、
 * セッション内のメッセージは時系列（昇順）に並べる。
 */
export function groupMatchedMessagesBySession(
  messages: MatchedUserMessage[]
): SessionMatchGroup[] {
  const groups = new Map<string, MatchedUserMessage[]>();

  for (const message of messages) {
    const list = groups.get(message.interview_session_id);
    if (list) {
      list.push(message);
    } else {
      groups.set(message.interview_session_id, [message]);
    }
  }

  return Array.from(groups.entries()).map(([sessionId, sessionMessages]) => ({
    sessionId,
    messages: sessionMessages.reverse(),
  }));
}
