import { findTagsByBillIds } from "../../repositories/bill-repository";

/**
 * 複数のbill_idに紐づくタグを一括取得し、bill_idごとにグループ化して返す
 * N+1問題を回避するためのヘルパー
 *
 * @deprecated repository関数 findTagsByBillIds を直接使用してください
 */
export async function fetchTagsByBillIds(
  _supabase: unknown,
  billIds: string[]
): Promise<Map<string, Array<{ id: string; label: string }>>> {
  return findTagsByBillIds(billIds);
}
