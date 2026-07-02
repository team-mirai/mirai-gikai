/**
 * Supabase の join で取得した interview_report を単一オブジェクトに正規化する。
 * 1:1 リレーションでも生成型上は配列で返るケースがあるため、最初の要素を取り出す。
 */
export function normalizeInterviewReport<T>(report: T | T[] | null): T | null {
  return Array.isArray(report) ? (report[0] ?? null) : report;
}
