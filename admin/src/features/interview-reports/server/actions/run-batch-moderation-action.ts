"use server";

import { cookies, headers } from "next/headers";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

interface BatchModerationResult {
  success: boolean;
  total?: number;
  processed?: number;
  failed?: number;
  error?: string;
}

/**
 * モデレーション一括評価を実行する Server Action
 *
 * API Route 経由で実行（maxDuration を活用するため）
 */
export async function runBatchModerationAction(): Promise<BatchModerationResult> {
  await requireAdmin();

  try {
    const headersList = await headers();
    const host = headersList.get("host");
    if (!host) {
      throw new Error("host ヘッダーが取得できませんでした");
    }
    const proto = headersList.get("x-forwarded-proto") || "http";
    const baseUrl = `${proto}://${host}`;
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const response = await fetch(`${baseUrl}/api/batch/moderation-scoring`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "モデレーション一括評価に失敗しました",
      };
    }

    return {
      success: true,
      total: data.total,
      processed: data.processed,
      failed: data.failed,
    };
  } catch (error) {
    console.error("Failed to run batch moderation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "モデレーション一括評価に失敗しました",
    };
  }
}
