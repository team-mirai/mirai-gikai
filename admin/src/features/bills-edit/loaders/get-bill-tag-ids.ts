import { findBillTagIdsByBillId } from "../repositories/bill-edit-repository";

/**
 * 議案に紐づくタグIDの配列を取得する
 */
export async function getBillTagIds(billId: string): Promise<string[]> {
  return findBillTagIdsByBillId(billId);
}
