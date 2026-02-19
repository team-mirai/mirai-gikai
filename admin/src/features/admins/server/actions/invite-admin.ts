"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { CreateAdminInput } from "../../shared/types";
import { validateEmail } from "../../shared/utils/validate-email";
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

    const emailError = validateEmail(email);
    if (emailError) {
      return { error: emailError };
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
      const msg = getErrorMessage(createError, "");
      if (
        msg.includes("already been registered") ||
        msg.includes("already exists")
      ) {
        return {
          error: "このメールアドレスは既に登録されています",
        };
      }
      return {
        error: `管理者の作成に失敗しました: ${getErrorMessage(createError, "不明なエラー")}`,
      };
    }

    revalidatePath("/admins");
    return { success: true };
  } catch (error) {
    console.error("Create admin error:", error);
    return {
      error: getErrorMessage(error, "管理者の作成中にエラーが発生しました"),
    };
  }
}
