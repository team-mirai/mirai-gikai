export function formatAverageDuration(
  avgDurationSeconds: number | null
): string {
  if (avgDurationSeconds == null || avgDurationSeconds <= 0) {
    return "-";
  }

  const totalSeconds = Math.max(1, Math.round(avgDurationSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}秒`;
  }

  if (seconds === 0) {
    return `${minutes}分`;
  }

  return `${minutes}分${seconds}秒`;
}
