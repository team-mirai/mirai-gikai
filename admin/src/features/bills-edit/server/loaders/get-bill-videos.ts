import "server-only";

import type { BillVideo } from "../../shared/types/bill-videos";
import { findBillVideosByBillId } from "../repositories/bill-edit-repository";

/**
 * 議案に紐づく動画を表示順で取得する
 */
export async function getBillVideos(billId: string): Promise<BillVideo[]> {
  return findBillVideosByBillId(billId);
}
