"use server";

import "server-only";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { trimOrNull } from "@/lib/utils/normalize-string";
import { validateOverview } from "../../shared/utils/validate-overview";
import { updateDietSessionOverviewRecord } from "../repositories/diet-session-repository";

export type UpdateActiveSessionOverviewInput = {
  id: string;
  overview: string | null;
};

export async function updateActiveSessionOverview(
  input: UpdateActiveSessionOverviewInput
) {
  try {
    await requireAdmin();

    const overviewError = validateOverview(input.overview);
    if (overviewError) return { error: overviewError };

    const data = await updateDietSessionOverviewRecord(
      input.id,
      trimOrNull(input.overview)
    );
    await invalidateWebCache([WEB_CACHE_TAGS.DIET_SESSIONS]);
    return { data };
  } catch (error) {
    console.error("Update active session overview error:", error);
    return {
      error: getErrorMessage(
        error,
        "トップページの説明更新中にエラーが発生しました"
      ),
    };
  }
}
