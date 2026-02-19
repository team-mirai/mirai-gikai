"use server";

import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
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
    // 既存のタグIDを取得
    const existingTagIds = new Set(await findBillsTagsByBillId(billId));
    const newTagIds = new Set(tagIds);

    // 削除すべきタグ
    const tagsToDelete = [...existingTagIds].filter((id) => !newTagIds.has(id));

    // 追加すべきタグ
    const tagsToAdd = [...newTagIds].filter((id) => !existingTagIds.has(id));

    // 削除処理
    if (tagsToDelete.length > 0) {
      await deleteBillsTags(billId, tagsToDelete);
    }

    // 追加処理
    if (tagsToAdd.length > 0) {
      await createBillsTags(billId, tagsToAdd);
    }

    // キャッシュを更新
    await invalidateWebCache();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `タグの更新中にエラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
    };
  }
}
