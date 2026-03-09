"use server";

import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { StanceInput } from "../../shared/types";
import { createMiraiStance } from "../repositories/mirai-stance-repository";

export async function createStance(billId: string, data: StanceInput) {
  try {
    await createMiraiStance(billId, data);

    invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    return { success: true };
  } catch (error) {
    console.error("Error in createStance:", error);
    return {
      success: false,
      error: getErrorMessage(error, "予期しないエラーが発生しました"),
    };
  }
}
