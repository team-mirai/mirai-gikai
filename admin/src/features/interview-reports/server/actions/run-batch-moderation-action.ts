"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { env } from "@/lib/env";
import {
  findAllReportIds,
  findUnscoredReportIds,
} from "../repositories/interview-report-repository";

interface ModerationTargetResult {
  success: boolean;
  reportIds?: string[];
  error?: string;
}

interface ModerationChunkResult {
  success: boolean;
  total?: number;
  processed?: number;
  failed?: number;
  error?: string;
}

/**
 * モデレーション対象のレポートIDリストを取得する
 */
export async function fetchModerationTargetIds(
  mode: "unscored" | "all"
): Promise<ModerationTargetResult> {
  try {
    await requireAdmin();

    const reportIds =
      mode === "unscored"
        ? await findUnscoredReportIds()
        : await findAllReportIds();

    return { success: true, reportIds };
  } catch (error) {
    console.error("Failed to fetch moderation target ids:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "対象レポートの取得に失敗しました",
    };
  }
}

/**
 * 1チャンク分のモデレーション評価を実行する Server Action
 *
 * API Route 経由で実行（maxDuration を活用するため）
 */
export async function runModerationChunkAction(
  reportIds: string[]
): Promise<ModerationChunkResult> {
  try {
    await requireAdmin();
    const baseUrl = env.adminUrl;
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const response = await fetch(`${baseUrl}/api/batch/moderation-scoring`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ reportIds }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "モデレーション評価に失敗しました",
      };
    }

    return {
      success: true,
      total: data.total,
      processed: data.processed,
      failed: data.failed,
    };
  } catch (error) {
    console.error("Failed to run moderation chunk:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "モデレーション評価に失敗しました",
    };
  }
}
