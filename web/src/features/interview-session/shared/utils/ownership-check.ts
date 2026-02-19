/**
 * セッションの所有者かどうかをチェックする（既に取得したuser_idと比較）
 */
export function isSessionOwner(
  sessionUserId: string,
  currentUserId: string
): boolean {
  return sessionUserId === currentUserId;
}
