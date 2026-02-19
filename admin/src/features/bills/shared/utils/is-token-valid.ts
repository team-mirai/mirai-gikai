/**
 * トークンの有効期限が現在時刻より後かどうかを判定する
 * @param expiresAt - 有効期限のISO文字列
 * @param now - 現在時刻（テスト用に注入可能）
 */
export function isTokenValid(
  expiresAt: string,
  now: Date = new Date()
): boolean {
  const expiresAtDate = new Date(expiresAt);
  return expiresAtDate > now;
}
