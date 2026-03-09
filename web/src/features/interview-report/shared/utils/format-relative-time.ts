/**
 * 日付を相対時間表記に変換する（例: "1時間前", "3日前", "2ヶ月前"）
 */
export function formatRelativeTime(
  dateString: string,
  now: Date = new Date()
): string {
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 30) return `${diffDays}日前`;
  if (diffMonths < 12) return `${diffMonths}ヶ月前`;
  return `${diffYears}年前`;
}
