import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { findBillContentByDifficulty } from "../../repositories/bill-repository";

/**
 * 指定された難易度の議案コンテンツを取得
 * @param billId 議案ID
 * @param difficultyLevel 難易度レベル
 */
export async function getBillContentWithDifficulty(
  billId: string,
  difficultyLevel: DifficultyLevelEnum
) {
  return findBillContentByDifficulty(billId, difficultyLevel);
}
