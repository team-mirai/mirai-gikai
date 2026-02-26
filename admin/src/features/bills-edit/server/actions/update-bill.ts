"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  WEB_CACHE_TAGS,
  invalidateWebCache,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { type BillUpdateInput, billUpdateSchema } from "../../shared/types";
import { updateBillRecord } from "../repositories/bill-edit-repository";

export async function updateBill(id: string, input: BillUpdateInput) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    // バリデーション
    const validatedData = billUpdateSchema.parse(input);

    // Supabaseで更新
    await updateBillRecord(id, {
      ...validatedData,
      published_at: validatedData.published_at
        ? new Date(validatedData.published_at).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    });

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
  } catch (error) {
    console.error("Update bill error:", error);
    throw new Error(
      getErrorMessage(error, "議案の更新中にエラーが発生しました")
    );
  }
}
