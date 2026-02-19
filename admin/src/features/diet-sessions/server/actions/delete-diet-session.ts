"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { DeleteDietSessionInput } from "../../shared/types";
import { deleteDietSessionRecord } from "../repositories/diet-session-repository";

export async function deleteDietSession(input: DeleteDietSessionInput) {
  try {
    await requireAdmin();

    await deleteDietSessionRecord(input.id);

    await invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Delete diet session error:", error);
    return {
      error: getErrorMessage(error, "国会会期の削除中にエラーが発生しました"),
    };
  }
}
