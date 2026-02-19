"use server";

import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { CreateTagInput } from "../types";
import { createTagRecord } from "../repositories/tag-repository";

export async function createTag(input: CreateTagInput) {
  try {
    await requireAdmin();

    // バリデーション
    if (!input.label || input.label.trim().length === 0) {
      return { error: "タグ名を入力してください" };
    }

    const result = await createTagRecord({
      label: input.label.trim(),
    });

    if (result.error) {
      // UNIQUE制約違反
      if (result.error.code === "23505") {
        return { error: "このタグ名は既に存在します" };
      }
      return { error: `タグの作成に失敗しました: ${result.error.message}` };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { data: result.data };
  } catch (error) {
    console.error("Create tag error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "タグの作成中にエラーが発生しました" };
  }
}
