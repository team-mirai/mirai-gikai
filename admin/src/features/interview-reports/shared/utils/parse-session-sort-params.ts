import { parseSortParams } from "@/lib/sort";
import type { SessionSortConfig } from "../types";
import { DEFAULT_SESSION_SORT, SESSION_SORT_FIELDS } from "../types";

export function parseSessionSortParams(
  sort?: string,
  order?: string
): SessionSortConfig {
  return parseSortParams(
    SESSION_SORT_FIELDS,
    DEFAULT_SESSION_SORT,
    sort,
    order
  );
}
