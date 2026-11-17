"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type SupplementaryResolutionHouse,
  supplementaryResolutionHouseSchema,
} from "../../shared/types";
import { deleteSupplementaryResolutionByHouse } from "../repositories/supplementary-resolution-repository";

export async function deleteSupplementaryResolution(
  billId: string,
  house: SupplementaryResolutionHouse
) {
  await requireAdmin();

  const parsedHouse = supplementaryResolutionHouseSchema.safeParse(house);
  if (!parsedHouse.success) {
    return { success: false, error: "入力内容が不正です" };
  }

  try {
    await deleteSupplementaryResolutionByHouse(billId, parsedHouse.data);
    return { success: true };
  } catch (error) {
    console.error("Error in deleteSupplementaryResolution:", error);
    return {
      success: false,
      error: getErrorMessage(error, "予期しないエラーが発生しました"),
    };
  }
}
