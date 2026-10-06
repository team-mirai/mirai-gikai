/**
 * 会期の期間を「2025.10.24〜12.17」の形式に整形する純粋関数。
 *
 * 終了日が開始日と同じ年なら年を省き、年をまたぐ場合は終了日にも年を付ける。
 * DBの date 型（YYYY-MM-DD）を文字列のまま扱い、タイムゾーンの影響を受けないようにする。
 */
export function formatSessionPeriod(
  startDate: string,
  endDate: string
): string {
  const [startYear, startMonth, startDay] = startDate.split("-");
  const [endYear, endMonth, endDay] = endDate.split("-");
  const start = `${startYear}.${startMonth}.${startDay}`;
  const end =
    startYear === endYear
      ? `${endMonth}.${endDay}`
      : `${endYear}.${endMonth}.${endDay}`;
  return `${start}〜${end}`;
}
