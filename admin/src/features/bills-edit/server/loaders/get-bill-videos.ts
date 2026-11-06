import "server-only";

import type { BillVideo } from "../../shared/types/bill-videos";
import { findBillVideosByBillId } from "../repositories/bill-edit-repository";

/**
 * 議案に紐づく動画（議論の種類ごとに最大1本）を取得する
 */
export async function getBillVideos(billId: string): Promise<BillVideo[]> {
  return findBillVideosByBillId(billId);
}
