import { parseSortParams } from "@/lib/sort";
import type { BillSortConfig } from "../types";
import { BILL_SORT_FIELDS, DEFAULT_BILL_SORT } from "../types";

export function parseBillSortParams(
  sort?: string,
  order?: string
): BillSortConfig {
  return parseSortParams(BILL_SORT_FIELDS, DEFAULT_BILL_SORT, sort, order);
}
