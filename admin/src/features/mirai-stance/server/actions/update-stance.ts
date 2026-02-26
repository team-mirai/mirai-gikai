"use server";

import {
  WEB_CACHE_TAGS,
  invalidateWebCache,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { StanceInput } from "../../shared/types";
import { updateMiraiStance } from "../repositories/mirai-stance-repository";

export async function updateStance(stanceId: string, data: StanceInput) {
  try {
    await updateMiraiStance(stanceId, data);

    invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    return { success: true };
  } catch (error) {
    console.error("Error in updateStance:", error);
    return {
      success: false,
      error: getErrorMessage(error, "予期しないエラーが発生しました"),
    };
  }
}
