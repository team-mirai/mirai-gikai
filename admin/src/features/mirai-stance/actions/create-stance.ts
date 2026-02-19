"use server";

import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { StanceInput } from "../types";
import { createMiraiStance } from "../repositories/mirai-stance-repository";

export async function createStance(billId: string, data: StanceInput) {
  try {
    await createMiraiStance(billId, data);

    invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Error in createStance:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
    };
  }
}
