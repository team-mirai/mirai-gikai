"use server";

import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { type StanceInput, stanceInputSchema } from "../../shared/types";
import { isStanceBecomingPublished } from "../../shared/utils/is-stance-becoming-published";
import {
  findStanceById,
  updateMiraiStance,
} from "../repositories/mirai-stance-repository";
import { closeInterviewsOnStancePublish } from "../services/close-interviews-on-stance-publish";

export async function updateStance(stanceId: string, data: StanceInput) {
  try {
    const input = stanceInputSchema.parse(data);
    const before = await findStanceById(stanceId);
    await updateMiraiStance(stanceId, input);
    if (
      before &&
      isStanceBecomingPublished(before.is_published, input.isPublished)
    ) {
      await closeInterviewsOnStancePublish(before.bill_id);
    }

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
