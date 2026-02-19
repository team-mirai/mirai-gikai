"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { CreateTagInput } from "../../shared/types";
import { mapTagDbError } from "../../shared/utils/map-tag-db-error";
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
      return { error: mapTagDbError(result.error, "作成") };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { data: result.data };
  } catch (error) {
    console.error("Create tag error:", error);
    return {
      error: getErrorMessage(error, "タグの作成中にエラーが発生しました"),
    };
  }
}
