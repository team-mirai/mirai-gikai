import type { MiraiStance } from "../types";
import { findStanceByBillId } from "../repositories/mirai-stance-repository";

export async function getStanceByBillId(
  billId: string
): Promise<MiraiStance | null> {
  return findStanceByBillId(billId);
}
