import "server-only";

import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { OpenDataBillDetail } from "../../shared/types/open-data-bills";
import { toOpenDataBillDetail } from "../../shared/utils/to-open-data-bill";
import { findOpenDataPublishedBillById } from "../repositories/open-data-repository";

/**
 * 公開データAPI用の議案詳細を取得する。
 * 非公開・存在しない・指定難易度のコンテンツがない場合は null。
 */
export async function getOpenDataBillDetail(params: {
  billId: string;
  difficulty: DifficultyLevelEnum;
}): Promise<OpenDataBillDetail | null> {
  const row = await findOpenDataPublishedBillById(params);
  if (!row) return null;

  return toOpenDataBillDetail(row);
}
