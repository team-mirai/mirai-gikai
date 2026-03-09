import type { BillSortConfig, BillWithDietSession } from "../../shared/types";
import { findBillsWithDietSessions } from "../repositories/bill-repository";

export async function getBills(
  sortConfig?: BillSortConfig
): Promise<BillWithDietSession[]> {
  const data = await findBillsWithDietSessions(sortConfig);
  return data || [];
}
