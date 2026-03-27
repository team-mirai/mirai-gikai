"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { findInterviewConfigIdByBillId } from "../repositories/interview-report-repository";

interface BulkPublishParams {
  billId: string;
  maxModerationScore: number;
  minContentRichness: number;
}

interface BulkPublishResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

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

async function resolveConfigId(billId: string): Promise<string> {
  const config = await findInterviewConfigIdByBillId(billId);
  if (!config) {
    throw new Error("対象の議案にインタビュー設定が見つかりません");
  }
  return config.id;
}

export async function bulkPublishReportsAction(
  params: BulkPublishParams
): Promise<BulkPublishResult> {
  await requireAdmin();

  try {
    const configId = await resolveConfigId(params.billId);
    const supabase = createAdminClient();

    // interview_session_id で議案スコープを絞るため、先にセッションIDを取得
    const { data: sessions, error: sessionError } = await supabase
      .from("interview_sessions")
      .select("id")
      .eq("interview_config_id", configId);

    if (sessionError) {
      throw new Error(`Failed to fetch sessions: ${sessionError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    const sessionIds = sessions.map((s) => s.id);

    // 条件付きUPDATEで原子的に更新
    const updateQuery = supabase
      .from("interview_report")
      .update({ is_public_by_admin: true })
      .in("interview_session_id", sessionIds);

    const { data: updated, error: updateError } =
      await applyPublishTargetFilters(updateQuery, params).select("id");

    if (updateError) {
      throw new Error(`Failed to bulk update reports: ${updateError.message}`);
    }

    revalidateTag("public-interview-reports");

    return { success: true, updatedCount: updated?.length ?? 0 };
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
    const configId = await resolveConfigId(params.billId);
    const supabase = createAdminClient();

    // 議案スコープ: セッションIDを取得
    const { data: sessions, error: sessionError } = await supabase
      .from("interview_sessions")
      .select("id")
      .eq("interview_config_id", configId);

    if (sessionError) {
      throw new Error(`Failed to fetch sessions: ${sessionError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return { success: true, count: 0 };
    }

    const sessionIds = sessions.map((s) => s.id);

    const countQuery = supabase
      .from("interview_report")
      .select("id", { count: "exact", head: true })
      .in("interview_session_id", sessionIds);

    const { count, error } = await applyPublishTargetFilters(
      countQuery,
      params
    );

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
