"use server";

import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { StanceInput } from "../types";
import { updateMiraiStance } from "../repositories/mirai-stance-repository";

export async function updateStance(stanceId: string, data: StanceInput) {
  try {
    await updateMiraiStance(stanceId, data);

    invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Error in updateStance:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
    };
  }
}
