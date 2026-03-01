"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { UpdateTagInput } from "../../shared/types";
import { mapTagDbError } from "../../shared/utils/map-tag-db-error";
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
      return { error: mapTagDbError(result.error, "更新") };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { data: result.data };
  } catch (error) {
    console.error("Update tag error:", error);
    return {
      error: getErrorMessage(error, "タグの更新中にエラーが発生しました"),
    };
  }
}
