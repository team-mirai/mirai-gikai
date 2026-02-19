"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  setActiveDietSessionRecord,
  findDietSessionById,
} from "../repositories/diet-session-repository";

export type SetActiveDietSessionInput = {
  id: string;
};

export async function setActiveDietSession(input: SetActiveDietSessionInput) {
  try {
    await requireAdmin();

    // Atomic operation: set only the target session as active
    // Uses a database function to avoid race conditions
    await setActiveDietSessionRecord(input.id);

    // Fetch the updated session to return
    const data = await findDietSessionById(input.id);

    await invalidateWebCache();
    return { data };
  } catch (error) {
    console.error("Set active diet session error:", error);
    return {
      error: getErrorMessage(
        error,
        "アクティブセッションの設定中にエラーが発生しました"
      ),
    };
  }
}
