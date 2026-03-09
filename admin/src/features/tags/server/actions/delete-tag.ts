"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { DeleteTagInput } from "../../shared/types";
import { mapTagDbError } from "../../shared/utils/map-tag-db-error";
import { deleteTagRecord } from "../repositories/tag-repository";

export async function deleteTag(input: DeleteTagInput) {
  try {
    await requireAdmin();

    const result = await deleteTagRecord(input.id);

    if (result.error) {
      return { error: mapTagDbError(result.error, "削除") };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true };
  } catch (error) {
    console.error("Delete tag error:", error);
    return {
      error: getErrorMessage(error, "タグの削除中にエラーが発生しました"),
    };
  }
}
