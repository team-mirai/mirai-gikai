"use server";

import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { type StanceInput, stanceInputSchema } from "../../shared/types";
import { isStanceBecomingPublished } from "../../shared/utils/is-stance-becoming-published";
import { createMiraiStance } from "../repositories/mirai-stance-repository";
import { closeInterviewsOnStancePublish } from "../services/close-interviews-on-stance-publish";

export async function createStance(billId: string, data: StanceInput) {
  try {
    const input = stanceInputSchema.parse(data);
    await createMiraiStance(billId, input);
    if (isStanceBecomingPublished(null, input.isPublished)) {
      await closeInterviewsOnStancePublish(billId);
    }

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
