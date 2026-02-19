"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { BillPublishStatus } from "../../shared/types";
import { updateBillPublishStatus } from "../repositories/bill-repository";

interface UpdatePublishStatusResult {
  success: boolean;
  error?: string;
}

// フォームアクション用のラッパー関数
export async function updatePublishStatusAction(formData: FormData) {
  await requireAdmin();

  const billId = formData.get("billId") as string;
  const newStatus = formData.get("newStatus") as BillPublishStatus;

  if (!billId || !newStatus) {
    throw new Error("必要なパラメータが不足しています");
  }

  const result = await _updateBillPublishStatus(billId, newStatus);

  if (!result.success) {
    throw new Error(result.error || "ステータスの更新に失敗しました");
  }

  revalidatePath("/bills");
}

async function _updateBillPublishStatus(
  billId: string,
  publishStatus: BillPublishStatus
): Promise<UpdatePublishStatusResult> {
  try {
    await updateBillPublishStatus(billId, publishStatus);

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { success: true };
  } catch (error) {
    console.error("Error updating publish status:", error);
    return {
      success: false,
      error: "ステータスの更新に失敗しました",
    };
  }
}
