"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type BillVideosFormInput,
  billVideosInputSchema,
} from "../../shared/types/bill-videos";
import { saveBillVideos } from "../repositories/bill-edit-repository";

/**
 * 議案の動画を議論の種類ごとに保存する（空にした種類は削除する）
 */
export async function updateBillVideos(
  billId: string,
  videos: BillVideosFormInput
) {
  await requireAdmin();

  const parsed = billVideosInputSchema.safeParse(videos);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "入力内容が不正です",
    };
  }

  try {
    await saveBillVideos(billId, parsed.data);
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `動画の更新中にエラーが発生しました: ${getErrorMessage(error, "不明なエラー")}`,
    };
  }
}
