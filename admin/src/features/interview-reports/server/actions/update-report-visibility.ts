"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { updateReportVisibility } from "../repositories/interview-report-repository";

interface UpdateReportVisibilityParams {
  reportId: string;
  isPublic: boolean;
  billId: string;
  sessionId: string;
}

interface UpdateReportVisibilityResult {
  success: boolean;
  error?: string;
}

export async function updateReportVisibilityAction(
  params: UpdateReportVisibilityParams
): Promise<UpdateReportVisibilityResult> {
  await requireAdmin();

  const { reportId, isPublic, billId, sessionId } = params;

  if (!reportId) {
    return {
      success: false,
      error: "レポートIDが必要です",
    };
  }

  try {
    await updateReportVisibility(reportId, isPublic);

    // Revalidate the detail page and list page
    revalidatePath(`/bills/${billId}/reports/${sessionId}`);
    revalidatePath(`/bills/${billId}/reports`);

    return { success: true };
  } catch (error) {
    console.error("Error updating report visibility:", error);
    return {
      success: false,
      error: "公開状態の更新に失敗しました",
    };
  }
}
