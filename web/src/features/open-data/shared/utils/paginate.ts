import { encodeCursor, type OpenDataCursor } from "./cursor";

/**
 * limit+1 件取得した行から次ページの有無を判定し、
 * ページ内の行と nextCursor を組み立てる。
 */
export function paginateRows<T>(
  rows: T[],
  limit: number,
  toCursor: (row: T) => OpenDataCursor
): { pageRows: T[]; nextCursor: string | null } {
  const pageRows = rows.slice(0, limit);
  const lastRow = pageRows.at(-1);
  const nextCursor =
    rows.length > limit && lastRow ? encodeCursor(toCursor(lastRow)) : null;
  return { pageRows, nextCursor };
}
