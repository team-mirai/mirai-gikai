/**
 * LLM が返す情報充実度スコアを 0-100 の整数に正規化する。
 * - 範囲外（<0 / >100）はクランプする
 * - 小数は四捨五入する
 * - 数値でない（null/undefined/NaN/Infinity）場合は null を返す
 *
 * zod schema 側で `.max(100)` 等の制約を課すと範囲外出力で ZodError になり
 * pipeline 全体が落ちるため、schema は緩く受けてここで正規化する。
 */
export function normalizeRichnessScore(
  value: number | null | undefined
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}
