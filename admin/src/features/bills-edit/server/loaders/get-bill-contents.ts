import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { BillContent } from "../../shared/types/bill-contents";
import { findBillContentsByBillId } from "../repositories/bill-edit-repository";

export async function getBillContents(billId: string): Promise<BillContent[]> {
  try {
    // 管理者権限チェック
    await requireAdmin();

    return await findBillContentsByBillId(billId);
  } catch (error) {
    console.error("Get bill contents error:", error);
    throw error;
  }
}
