import type { BillSortConfig, BillSortField, SortOrder } from "../types";

const VALID_SORT_FIELDS: BillSortField[] = [
  "created_at",
  "published_at",
  "status_order",
  "publish_status_order",
];

const VALID_SORT_ORDERS: SortOrder[] = ["asc", "desc"];

const DEFAULT_SORT: BillSortConfig = {
  field: "created_at",
  order: "desc",
};

export function parseBillSortParams(
  sort?: string,
  order?: string
): BillSortConfig {
  const field = VALID_SORT_FIELDS.includes(sort as BillSortField)
    ? (sort as BillSortField)
    : DEFAULT_SORT.field;

  const sortOrder = VALID_SORT_ORDERS.includes(order as SortOrder)
    ? (order as SortOrder)
    : DEFAULT_SORT.order;

  return { field, order: sortOrder };
}
