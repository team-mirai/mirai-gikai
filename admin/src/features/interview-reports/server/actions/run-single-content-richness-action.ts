"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { runSingleContentRichnessScoring } from "../services/content-richness-scoring";

interface SingleContentRichnessResult {
  success: boolean;
  total?: number;
  error?: string;
}

export async function runSingleContentRichnessAction(
  reportId: string,
  billId: string,
  sessionId: string
): Promise<SingleContentRichnessResult> {
  await requireAdmin();

  try {
    const { total } = await runSingleContentRichnessScoring(reportId);

    revalidatePath(`/bills/${billId}`, "layout");

    return { success: true, total };
  } catch (error) {
    console.error("Failed to run single content richness scoring:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "情報充実度の再評価に失敗しました",
    };
  }
}
