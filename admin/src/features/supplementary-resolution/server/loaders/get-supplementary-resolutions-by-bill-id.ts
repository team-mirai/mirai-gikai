import "server-only";

import type { SupplementaryResolution } from "../../shared/types";
import { findSupplementaryResolutionsByBillId } from "../repositories/supplementary-resolution-repository";

export async function getSupplementaryResolutionsByBillId(
  billId: string
): Promise<SupplementaryResolution[]> {
  return findSupplementaryResolutionsByBillId(billId);
}
