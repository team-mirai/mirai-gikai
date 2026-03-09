"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

interface RunTopicAnalysisResult {
  success: boolean;
  versionId?: string;
  error?: string;
}

/**
 * トピック解析を実行する Server Action
 *
 * API Route を呼び出してオーケストレーターを実行し、
 * 結果のversionIdを返す
 */
export async function runTopicAnalysisAction(
  billId: string
): Promise<RunTopicAnalysisResult> {
  await requireAdmin();

  try {
    // API Route 経由で実行（maxDuration を活用するため）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/topic-analysis/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "解析の実行に失敗しました",
      };
    }

    revalidatePath(`/bills/${billId}/topic-analysis`);

    return { success: true, versionId: data.versionId };
  } catch (error) {
    console.error("Failed to run topic analysis:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "解析の実行に失敗しました",
    };
  }
}
