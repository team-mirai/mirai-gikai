export function formatDurationSeconds(durationSeconds: number | null): string {
  if (durationSeconds == null || durationSeconds <= 0) {
    return "-";
  }

  const totalSeconds = Math.max(1, Math.round(durationSeconds));
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
