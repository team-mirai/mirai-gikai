"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import type { DeleteAdminInput } from "../types";

export async function deleteAdmin(input: DeleteAdminInput) {
  try {
    const currentAdmin = await requireAdmin();

    if (currentAdmin.id === input.id) {
      return { error: "自分自身を削除することはできません" };
    }

    const supabase = createAdminClient();

    const { error } = await supabase.auth.admin.deleteUser(input.id);

    if (error) {
      return { error: `管理者の削除に失敗しました: ${error.message}` };
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
