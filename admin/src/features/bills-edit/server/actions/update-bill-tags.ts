"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { calculateSetDiff } from "@/lib/utils/calculate-set-diff";
import {
  WEB_CACHE_TAGS,
  invalidateWebCache,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  findBillsTagsByBillId,
  deleteBillsTags,
  createBillsTags,
} from "../repositories/bill-edit-repository";

/**
 * 議案のタグを更新する
 * 既存のタグと新しいタグを比較して、差分のみを更新する
 */
export async function updateBillTags(billId: string, tagIds: string[]) {
  await requireAdmin();

  try {
    const existingTagIds = await findBillsTagsByBillId(billId);
    const { toAdd, toDelete } = calculateSetDiff(existingTagIds, tagIds);

    // 削除処理
    if (toDelete.length > 0) {
      await deleteBillsTags(billId, toDelete);
    }

    // 追加処理
    if (toAdd.length > 0) {
      await createBillsTags(billId, toAdd);
    }

    // キャッシュを更新
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `タグの更新中にエラーが発生しました: ${getErrorMessage(error, "不明なエラー")}`,
    };
  }
}
