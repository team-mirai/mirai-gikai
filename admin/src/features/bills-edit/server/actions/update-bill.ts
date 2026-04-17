"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
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
      submitted_date: validatedData.submitted_date
        ? `${validatedData.submitted_date}T00:00:00+09:00`
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
