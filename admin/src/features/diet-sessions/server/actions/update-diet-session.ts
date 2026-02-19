"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { trimOrNull } from "@/lib/utils/normalize-string";
import type { UpdateDietSessionInput } from "../../shared/types";
import { validateDateRange } from "../../shared/utils/validate-date-range";
import { validateSlug } from "../../shared/utils/validate-slug";
import { updateDietSessionRecord } from "../repositories/diet-session-repository";

export async function updateDietSession(input: UpdateDietSessionInput) {
  try {
    await requireAdmin();

    // バリデーション
    if (!input.name || input.name.trim().length === 0) {
      return { error: "国会名を入力してください" };
    }

    if (!input.start_date) {
      return { error: "開始日を入力してください" };
    }

    if (!input.end_date) {
      return { error: "終了日を入力してください" };
    }

    const slugError = validateSlug(input.slug);
    if (slugError) {
      return { error: slugError };
    }

    const dateRangeError = validateDateRange(input.start_date, input.end_date);
    if (dateRangeError) {
      return { error: dateRangeError };
    }

    const data = await updateDietSessionRecord(input.id, {
      name: input.name.trim(),
      slug: trimOrNull(input.slug),
      shugiin_url: trimOrNull(input.shugiin_url),
      start_date: input.start_date,
      end_date: input.end_date,
    });

    await invalidateWebCache();
    return { data };
  } catch (error) {
    console.error("Update diet session error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "国会会期の更新中にエラーが発生しました" };
  }
}
