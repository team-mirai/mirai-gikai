"use server";

import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { type BillUpdateInput, billUpdateSchema } from "../types";
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
    await invalidateWebCache();
  } catch (error) {
    console.error("Update bill error:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("議案の更新中にエラーが発生しました");
  }
}
