import "server-only";

import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { OpenDataBillsResult } from "../../shared/types/open-data-bills";
import type { OpenDataCursor } from "../../shared/utils/cursor";
import { paginateRows } from "../../shared/utils/paginate";
import { toOpenDataBillItem } from "../../shared/utils/to-open-data-bill";
import { findOpenDataPublishedBills } from "../repositories/open-data-repository";

/**
 * 公開データAPI用の議案一覧を取得する。
 * limit+1 件取得して次ページの有無を判定し、nextCursor を組み立てる。
 */
export async function getOpenDataBills(params: {
  limit: number;
  cursor: OpenDataCursor | null;
  difficulty: DifficultyLevelEnum;
}): Promise<OpenDataBillsResult> {
  const rows = await findOpenDataPublishedBills({
    limit: params.limit + 1,
    cursor: params.cursor,
    difficulty: params.difficulty,
  });

  const { pageRows, nextCursor } = paginateRows(rows, params.limit, (row) => ({
    createdAt: row.created_at,
    id: row.id,
  }));

  return { items: pageRows.map(toOpenDataBillItem), nextCursor };
}
