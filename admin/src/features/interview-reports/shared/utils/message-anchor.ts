/**
 * チャットメッセージのアンカーID。
 * session-detail.tsx の DOM id と CopyMessageLinkButton のリンク生成で
 * 共通利用し、フォーマットの不一致を防ぐ。
 */
export function getMessageAnchorId(messageId: string): string {
  return `message-${messageId}`;
}
