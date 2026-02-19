"use server";

import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { deleteMiraiStance } from "../repositories/mirai-stance-repository";

export async function deleteStance(stanceId: string) {
  try {
    await deleteMiraiStance(stanceId);

    invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Error in deleteStance:", error);
    return {
      success: false,
      error: getErrorMessage(error, "予期しないエラーが発生しました"),
    };
  }
}
