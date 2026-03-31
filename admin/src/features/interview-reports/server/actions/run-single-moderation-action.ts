"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { runSingleModerationScoring } from "../services/batch-moderation-scoring";

interface SingleModerationResult {
  success: boolean;
  score?: number;
  error?: string;
}

export async function runSingleModerationAction(
  reportId: string,
  billId: string,
  sessionId: string
): Promise<SingleModerationResult> {
  await requireAdmin();

  try {
    const { score } = await runSingleModerationScoring(reportId);

    revalidatePath(`/bills/${billId}`, "layout");

    return { success: true, score };
  } catch (error) {
    console.error("Failed to run single moderation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "モデレーション再評価に失敗しました",
    };
  }
}
