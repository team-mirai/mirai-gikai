/**
 * 日時文字列を日本時間の「YYYY/MM/DD HH:mm」形式に整形する。
 */
export function formatJstDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}
