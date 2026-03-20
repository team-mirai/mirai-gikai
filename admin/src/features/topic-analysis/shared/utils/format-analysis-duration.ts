/**
 * ミリ秒の差分を「X分Y秒」形式にフォーマットする
 */
export function formatDurationMs(diffMs: number): string {
  if (diffMs < 0) {
    return "-";
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}秒`;
  }
  return `${minutes}分${seconds}秒`;
}

/**
 * started_at と completed_at から所要時間を「X分Y秒」形式で返す
 * どちらかが null の場合は "-" を返す
 */
export function formatAnalysisDuration(
  startedAt: string | null,
  completedAt: string | null
): string {
  if (!startedAt || !completedAt) {
    return "-";
  }
  const diffMs =
    new Date(completedAt).getTime() - new Date(startedAt).getTime();
  return formatDurationMs(diffMs);
}
