"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { deleteSupplementaryResolutionByBillId } from "../repositories/supplementary-resolution-repository";

export async function deleteSupplementaryResolution(billId: string) {
  await requireAdmin();

  try {
    await deleteSupplementaryResolutionByBillId(billId);
    return { success: true };
  } catch (error) {
    console.error("Error in deleteSupplementaryResolution:", error);
    return {
      success: false,
      error: getErrorMessage(error, "予期しないエラーが発生しました"),
    };
  }
}
