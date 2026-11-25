"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type SupplementaryResolutionInput,
  supplementaryResolutionInputSchema,
} from "../../shared/types";
import { upsertSupplementaryResolution } from "../repositories/supplementary-resolution-repository";

export async function saveSupplementaryResolution(
  billId: string,
  data: SupplementaryResolutionInput
) {
  await requireAdmin();

  const parsed = supplementaryResolutionInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "入力内容が不正です",
    };
  }

  try {
    await upsertSupplementaryResolution(billId, parsed.data);
    // 公開サイトの議案詳細に附帯決議を出すので、議案のキャッシュを捨てる
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    return { success: true };
  } catch (error) {
    console.error("Error in saveSupplementaryResolution:", error);
    return {
      success: false,
      error: getErrorMessage(error, "予期しないエラーが発生しました"),
    };
  }
}
