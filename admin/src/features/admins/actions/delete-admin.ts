"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { DeleteAdminInput } from "../types";
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
      if (deleteError instanceof Error) {
        return {
          error: `管理者の削除に失敗しました: ${deleteError.message}`,
        };
      }
      return { error: "管理者の削除に失敗しました" };
    }

    revalidatePath("/admins");
    return { success: true };
  } catch (error) {
    console.error("Delete admin error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "管理者の削除中にエラーが発生しました" };
  }
}
