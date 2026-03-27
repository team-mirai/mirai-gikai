"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { chunkArray } from "../../shared/utils/chunk-array";

interface BulkPublishParams {
  maxModerationScore: number;
  minContentRichness: number;
}

interface BulkPublishResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

const UPDATE_CHUNK_SIZE = 500;

function applyPublishTargetFilters<
  T extends ReturnType<
    ReturnType<typeof createAdminClient>["from"]
  > extends infer Q
    ? Q
    : never,
>(query: T, params: BulkPublishParams): T {
  return (
    query as never as ReturnType<ReturnType<typeof createAdminClient>["from"]>
  )
    .eq("is_public_by_user", true)
    .eq("is_public_by_admin", false)
    .not("moderation_score", "is", null)
    .lte("moderation_score", params.maxModerationScore)
    .not("total_content_richness", "is", null)
    .gte("total_content_richness", params.minContentRichness) as never as T;
}

export async function bulkPublishReportsAction(
  params: BulkPublishParams
): Promise<BulkPublishResult> {
  await requireAdmin();

  try {
    const supabase = createAdminClient();

    const query = supabase.from("interview_report").select("id");
    const { data: targets, error: fetchError } =
      await applyPublishTargetFilters(query, params);

    if (fetchError) {
      throw new Error(`Failed to fetch target reports: ${fetchError.message}`);
    }

    if (!targets || targets.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    const targetIds = targets.map((r) => r.id);

    // 大量ID対策としてチャンク分割で更新
    const chunks = chunkArray(targetIds, UPDATE_CHUNK_SIZE);
    for (const chunk of chunks) {
      const { error: updateError } = await supabase
        .from("interview_report")
        .update({ is_public_by_admin: true })
        .in("id", chunk);

      if (updateError) {
        throw new Error(
          `Failed to bulk update reports: ${updateError.message}`
        );
      }
    }

    revalidateTag("public-interview-reports");

    return { success: true, updatedCount: targetIds.length };
  } catch (error) {
    console.error("Bulk publish failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "一括公開に失敗しました",
    };
  }
}

export async function countBulkPublishTargetsAction(
  params: BulkPublishParams
): Promise<{ success: boolean; count?: number; error?: string }> {
  await requireAdmin();

  try {
    const supabase = createAdminClient();

    const query = supabase
      .from("interview_report")
      .select("id", { count: "exact", head: true });
    const { count, error } = await applyPublishTargetFilters(query, params);

    if (error) {
      throw new Error(`Failed to count target reports: ${error.message}`);
    }

    return { success: true, count: count ?? 0 };
  } catch (error) {
    console.error("Count bulk publish targets failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "対象件数の取得に失敗しました",
    };
  }
}
