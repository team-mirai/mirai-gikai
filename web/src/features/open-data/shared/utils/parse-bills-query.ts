import {
  DEFAULT_DIFFICULTY,
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "@/features/bill-difficulty/shared/types";
import { isDifficultyLevel } from "@/features/bill-difficulty/shared/utils/is-difficulty-level";
import {
  type ParsedPaginationQuery,
  parsePaginationQuery,
} from "./parse-pagination-query";

export type ParsedDifficultyQuery =
  | { ok: true; difficulty: DifficultyLevelEnum }
  | { ok: false; error: string };

/**
 * difficulty パラメータを検証・解析する。未指定は既定値。
 */
export function parseDifficultyQuery(
  searchParams: URLSearchParams
): ParsedDifficultyQuery {
  const value = searchParams.get("difficulty");
  if (value === null) {
    return { ok: true, difficulty: DEFAULT_DIFFICULTY };
  }
  if (!isDifficultyLevel(value)) {
    return {
      ok: false,
      error: `difficulty は ${VALID_DIFFICULTY_LEVELS.join(" / ")} のいずれかで指定してください`,
    };
  }
  return { ok: true, difficulty: value };
}

export type ParsedBillsQuery =
  | (Extract<ParsedPaginationQuery, { ok: true }> & {
      difficulty: DifficultyLevelEnum;
    })
  | { ok: false; error: string };

/**
 * 議案オープンデータAPIのクエリパラメータ
 * （limit / cursor / difficulty）を検証・解析する。
 */
export function parseBillsQuery(
  searchParams: URLSearchParams
): ParsedBillsQuery {
  const pagination = parsePaginationQuery(searchParams);
  if (!pagination.ok) {
    return pagination;
  }

  const difficulty = parseDifficultyQuery(searchParams);
  if (!difficulty.ok) {
    return difficulty;
  }

  return { ...pagination, difficulty: difficulty.difficulty };
}
