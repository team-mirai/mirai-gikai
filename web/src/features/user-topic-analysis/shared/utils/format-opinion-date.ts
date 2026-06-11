/**
 * トピック詳細の意見カードに表示する日時を整形する純粋関数。
 *
 * - 30日以内: 相対表記（例: "2時間前" "1週間前"）
 * - それ以前: 絶対日付 "YYYY.M.D"
 *
 * null/不正な値のときは空文字を返す。
 */
export function formatOpinionDate(
  dateString: string | null,
  now: Date = new Date()
): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}
