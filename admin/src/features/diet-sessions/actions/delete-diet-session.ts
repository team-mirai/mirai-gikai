"use server";

import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { DeleteDietSessionInput } from "../types";
import { deleteDietSessionRecord } from "../repositories/diet-session-repository";

export async function deleteDietSession(input: DeleteDietSessionInput) {
  try {
    await requireAdmin();

    await deleteDietSessionRecord(input.id);

    await invalidateWebCache();
    return { success: true };
  } catch (error) {
    console.error("Delete diet session error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "国会会期の削除中にエラーが発生しました" };
  }
}
