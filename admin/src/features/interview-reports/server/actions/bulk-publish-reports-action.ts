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

    const { data, error } = await supabase.rpc("bulk_publish_reports", {
      p_config_id: configId,
      p_max_moderation_score: params.maxModerationScore,
      p_min_content_richness: params.minContentRichness,
    });

    if (error) {
      throw new Error(`Failed to bulk publish reports: ${error.message}`);
    }

    const updatedCount = data ?? 0;

    revalidateTag("public-interview-reports");

    return { success: true, updatedCount };
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

    const { data, error } = await supabase.rpc("count_bulk_publish_targets", {
      p_config_id: configId,
      p_max_moderation_score: params.maxModerationScore,
      p_min_content_richness: params.minContentRichness,
    });

    if (error) {
      throw new Error(`Failed to count target reports: ${error.message}`);
    }

    return { success: true, count: data ?? 0 };
  } catch (error) {
    console.error("Count bulk publish targets failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "対象件数の取得に失敗しました",
    };
  }
}
