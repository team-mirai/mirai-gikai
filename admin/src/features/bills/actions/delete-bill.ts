"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { deleteBillById } from "../repositories/bill-repository";

export async function deleteBill(id: string) {
  try {
    await requireAdmin();

    // 議案を削除
    await deleteBillById(id);

    // キャッシュをリフレッシュ
    revalidatePath("/bills");
  } catch (error) {
    console.error("Delete bill error:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("議案の削除中にエラーが発生しました");
  }
}
