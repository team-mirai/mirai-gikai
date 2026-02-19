"use server";

import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import type { DeleteTagInput } from "../types";
import { deleteTagRecord } from "../repositories/tag-repository";

export async function deleteTag(input: DeleteTagInput) {
  try {
    await requireAdmin();

    const result = await deleteTagRecord(input.id);

    if (result.error) {
      // レコードが見つからない
      if (result.error.code === "PGRST116") {
        return { error: "タグが見つかりません" };
      }
      return { error: `タグの削除に失敗しました: ${result.error.message}` };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { success: true };
  } catch (error) {
    console.error("Delete tag error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "タグの削除中にエラーが発生しました" };
  }
}
