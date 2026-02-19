"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { UpdateTagInput } from "../../shared/types";
import { updateTagRecord } from "../repositories/tag-repository";

export async function updateTag(input: UpdateTagInput) {
  try {
    await requireAdmin();

    // バリデーション
    if (!input.label || input.label.trim().length === 0) {
      return { error: "タグ名を入力してください" };
    }

    const result = await updateTagRecord(input.id, {
      label: input.label.trim(),
      description: input.description,
      featured_priority: input.featured_priority,
    });

    if (result.error) {
      // UNIQUE制約違反
      if (result.error.code === "23505") {
        return { error: "このタグ名は既に存在します" };
      }
      // レコードが見つからない
      if (result.error.code === "PGRST116") {
        return { error: "タグが見つかりません" };
      }
      return { error: `タグの更新に失敗しました: ${result.error.message}` };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { data: result.data };
  } catch (error) {
    console.error("Update tag error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "タグの更新中にエラーが発生しました" };
  }
}
