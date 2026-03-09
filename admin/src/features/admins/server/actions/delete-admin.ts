"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { DeleteAdminInput } from "../../shared/types";
import { deleteAuthUser } from "../repositories/admin-repository";

export async function deleteAdmin(input: DeleteAdminInput) {
  try {
    const currentAdmin = await requireAdmin();

    if (currentAdmin.id === input.id) {
      return { error: "自分自身を削除することはできません" };
    }

    try {
      await deleteAuthUser(input.id);
    } catch (deleteError) {
      return {
        error: `管理者の削除に失敗しました: ${getErrorMessage(deleteError, "不明なエラー")}`,
      };
    }

    revalidatePath("/admins");
    return { success: true };
  } catch (error) {
    console.error("Delete admin error:", error);
    return {
      error: getErrorMessage(error, "管理者の削除中にエラーが発生しました"),
    };
  }
}
