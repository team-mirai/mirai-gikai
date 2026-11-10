import "server-only";

import type { SupplementaryResolution } from "../../shared/types";
import { findSupplementaryResolutionByBillId } from "../repositories/supplementary-resolution-repository";

export async function getSupplementaryResolutionByBillId(
  billId: string
): Promise<SupplementaryResolution | null> {
  return findSupplementaryResolutionByBillId(billId);
}
