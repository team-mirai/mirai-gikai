/**
 * インタビューの残り目安時間（分）を計算する純粋関数
 *
 * @param estimatedDuration - 目安時間（分）。nullの場合はタイムマネジメント不要
 * @param sessionStartedAt - セッション開始時刻（ISO string）
 * @param now - 現在時刻（テスト用にDI可能）
 * @returns 残り分数（切り上げ）。estimatedDurationがnullならnullを返す
 */
export function calcRemainingMinutes(
  estimatedDuration: number | null | undefined,
  sessionStartedAt: string,
  now?: Date
): number | null {
  if (!estimatedDuration) return null;
  const elapsed =
    ((now ?? new Date()).getTime() - new Date(sessionStartedAt).getTime()) /
    60000;
  return Math.max(0, Math.ceil(estimatedDuration - elapsed));
}
