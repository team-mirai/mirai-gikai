/**
 * 開始時刻と完了時刻からミリ秒差を計算し「X時間Y分」の日本語表示に変換する
 */
export function formatDuration(
  startedAt: string,
  completedAt: string | null
): string {
  if (!completedAt) return "-";

  const start = new Date(startedAt);
  const end = new Date(completedAt);
  const diffMs = end.getTime() - start.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}時間${remainingMinutes}分`;
  }
  return `${minutes}分`;
}
