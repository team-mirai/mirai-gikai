"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { type BillCreateInput, billCreateSchema } from "../../shared/types";
import { createBillRecord } from "../repositories/bill-edit-repository";

export async function createBill(input: BillCreateInput) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    // バリデーション
    const validatedData = billCreateSchema.parse(input);

    const insertData = {
      ...validatedData,
      published_at: validatedData.published_at
        ? new Date(validatedData.published_at).toISOString()
        : null,
    };

    // Supabaseに挿入
    await createBillRecord(insertData);

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
  } catch (error) {
    console.error("Create bill error:", error);
    throw new Error(
      getErrorMessage(error, "議案の作成中にエラーが発生しました")
    );
  }

  // 成功したら一覧ページへリダイレクト
  redirect("/bills");
}
