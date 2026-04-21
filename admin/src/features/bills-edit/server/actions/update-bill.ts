"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { closeOtherPublicConfigs } from "@/features/interview-config/server/repositories/interview-config-repository";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
  type WebCacheTag,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { shouldAutoCloseInterviewOnBillStatus } from "../../shared/utils/should-auto-close-interview";
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

    // 法案成立時は関連する公開中インタビューを自動でクローズする
    const tagsToInvalidate: WebCacheTag[] = [WEB_CACHE_TAGS.BILLS];
    if (shouldAutoCloseInterviewOnBillStatus(validatedData.status)) {
      await closeOtherPublicConfigs(id);
      tagsToInvalidate.push(WEB_CACHE_TAGS.INTERVIEW_CONFIGS);
    }

    // web側のキャッシュを無効化
    await invalidateWebCache(tagsToInvalidate);
  } catch (error) {
    console.error("Update bill error:", error);
    throw new Error(
      getErrorMessage(error, "議案の更新中にエラーが発生しました")
    );
  }
}
