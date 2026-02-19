"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { CreateAdminInput } from "../../shared/types";
import {
  findAdminUsers,
  createAuthUser,
} from "../repositories/admin-repository";

export async function createAdmin(input: CreateAdminInput) {
  try {
    await requireAdmin();

    const email = input.email.trim().toLowerCase();
    if (!email) {
      return { error: "メールアドレスを入力してください" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "有効なメールアドレスを入力してください" };
    }

    const password = input.password;
    if (!password || password.length < 6) {
      return { error: "パスワードは6文字以上で入力してください" };
    }

    // 作成前に既存の管理者かチェック（DB関数でadminのみ効率的に取得）
    const admins = await findAdminUsers();
    const alreadyAdmin = admins?.find((a) => a.email?.toLowerCase() === email);
    if (alreadyAdmin) {
      return {
        error: "このメールアドレスは既に管理者として登録されています",
      };
    }

    // パスワード指定で管理者ユーザーを作成
    try {
      await createAuthUser({ email, password });
    } catch (createError) {
      if (createError instanceof Error) {
        if (
          createError.message.includes("already been registered") ||
          createError.message.includes("already exists")
        ) {
          return {
            error: "このメールアドレスは既に登録されています",
          };
        }
        return {
          error: `管理者の作成に失敗しました: ${createError.message}`,
        };
      }
      return {
        error: "管理者の作成に失敗しました",
      };
    }

    revalidatePath("/admins");
    return { success: true };
  } catch (error) {
    console.error("Create admin error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "管理者の作成中にエラーが発生しました" };
  }
}
