"use server";

import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
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
      error:
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
    };
  }
}
