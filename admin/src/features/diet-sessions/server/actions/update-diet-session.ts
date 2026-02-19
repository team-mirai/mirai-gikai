"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { UpdateDietSessionInput } from "../../shared/types";
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

    // slug のバリデーション（半角英数字とハイフンのみ）
    if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
      return {
        error: "スラッグは半角英小文字、数字、ハイフンのみ使用できます",
      };
    }

    // 日付の妥当性チェック
    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);

    if (endDate < startDate) {
      return { error: "終了日は開始日以降の日付を指定してください" };
    }

    const data = await updateDietSessionRecord(input.id, {
      name: input.name.trim(),
      slug: input.slug?.trim() || null,
      shugiin_url: input.shugiin_url?.trim() || null,
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
