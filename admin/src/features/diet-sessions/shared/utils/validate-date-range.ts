/**
 * 日付範囲のバリデーション
 * endDate が startDate より前の場合にエラーメッセージを返す
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): string | null {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return "終了日は開始日以降の日付を指定してください";
  }

  return null;
}
