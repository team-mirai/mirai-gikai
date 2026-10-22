"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type BillVideoFormItem,
  billVideosInputSchema,
} from "../../shared/types/bill-videos";
import { replaceBillVideos } from "../repositories/bill-edit-repository";

/**
 * 議案の動画一覧を入力内容で置き換える（配列順が表示順になる）
 */
export async function updateBillVideos(
  billId: string,
  videos: BillVideoFormItem[]
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
    await replaceBillVideos(billId, parsed.data);
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `動画の更新中にエラーが発生しました: ${getErrorMessage(error, "不明なエラー")}`,
    };
  }
}
