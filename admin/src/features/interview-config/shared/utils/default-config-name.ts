/**
 * インタビュー設定のデフォルト名を生成する。
 * 日付は Asia/Tokyo タイムゾーンで「YYYY/MM/DD 作成」形式。
 */
export function generateDefaultConfigName(now: Date = new Date()): string {
  const date = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(now);
  return `${date} 作成`;
}
