import { decodeCursor, type OpenDataCursor } from "./cursor";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type ParsedInterviewsQuery =
  | { ok: true; limit: number; cursor: OpenDataCursor | null }
  | { ok: false; error: string };

/**
 * 公開データAPIのクエリパラメータ（limit / cursor）を検証・解析する。
 */
export function parseInterviewsQuery(
  searchParams: URLSearchParams
): ParsedInterviewsQuery {
  const limitParam = searchParams.get("limit");
  const limit = limitParam === null ? DEFAULT_LIMIT : Number(limitParam);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return {
      ok: false,
      error: `limit は 1〜${MAX_LIMIT} の整数で指定してください`,
    };
  }

  const cursorParam = searchParams.get("cursor");
  const cursor = cursorParam === null ? null : decodeCursor(cursorParam);
  if (cursorParam !== null && cursor === null) {
    return { ok: false, error: "cursor の形式が不正です" };
  }

  return { ok: true, limit, cursor };
}

/**
 * 環境変数等の文字列を正の整数として解析する。不正・未設定は fallback。
 * `Number(x) || fallback` と違い、0 や NaN を暗黙に既定値へ丸めた事実が
 * 分かるよう明示的に判定する（0 は「制限なし」ではなく不正値として扱う）。
 */
export function toPositiveInt(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
