import type { BillWithDietSession } from "../../shared/types";
import { findBillsWithDietSessions } from "../repositories/bill-repository";

export async function getBills(): Promise<BillWithDietSession[]> {
  const data = await findBillsWithDietSessions();
  return data || [];
}
