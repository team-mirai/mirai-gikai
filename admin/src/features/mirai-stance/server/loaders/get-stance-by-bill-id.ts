import type { MiraiStance } from "../../shared/types";
import { findStanceByBillId } from "../repositories/mirai-stance-repository";

export async function getStanceByBillId(
  billId: string
): Promise<MiraiStance | null> {
  return findStanceByBillId(billId);
}
