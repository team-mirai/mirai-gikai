/**
 * 日時フォーマット
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}年${month}月${day}日  ${hours}:${minutes}`;
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
