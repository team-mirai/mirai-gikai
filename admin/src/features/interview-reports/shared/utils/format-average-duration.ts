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

export function formatTotalDurationSeconds(
  durationSeconds: number | null
): string {
  if (durationSeconds == null || durationSeconds <= 0) {
    return "-";
  }

  const totalMinutes = Math.floor(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}分`;
  }

  if (minutes === 0) {
    return `${hours}時間`;
  }

  return `${hours}時間${minutes}分`;
}
