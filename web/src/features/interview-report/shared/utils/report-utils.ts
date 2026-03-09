/**
 * 日時フォーマット（日本時間）
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}年${get("month")}月${get("day")}日  ${get("hour")}:${get("minute")}`;
}

/**
 * インタビュー時間の計算
 */
export function calculateDuration(
  startedAt: string,
  completedAt: string | null
): string {
  if (!completedAt) return "-";
  const start = new Date(startedAt);
  const end = new Date(completedAt);
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.round(diffMs / 1000 / 60);
  return `${diffMinutes} 分`;
}

/**
 * 文字数カウント（ユーザーのメッセージのみ）
 */
export function countCharacters(
  messages: Array<{ content: string; role: string }>
): number {
  return messages
    .filter((msg) => msg.role === "user")
    .reduce((acc, msg) => acc + msg.content.length, 0);
}
