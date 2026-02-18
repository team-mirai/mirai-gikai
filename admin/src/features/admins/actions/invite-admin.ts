"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import type { CreateAdminInput } from "../types";

export async function createAdmin(input: CreateAdminInput) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

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

    // 既存ユーザーチェック
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      const roles = existingUser.app_metadata?.roles || [];
      if (roles.includes("admin")) {
        return {
          error: "このメールアドレスは既に管理者として登録されています",
        };
      }

      // 既存ユーザーにadmin権限を付与
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          app_metadata: { roles: ["admin"] },
        }
      );

      if (updateError) {
        return {
          error: `管理者権限の付与に失敗しました: ${updateError.message}`,
        };
      }

      revalidatePath("/admins");
      return { success: true };
    }

    // 新規ユーザー: パスワード指定で作成
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { roles: ["admin"] },
    });

    if (createError) {
      return {
        error: `管理者の作成に失敗しました: ${createError.message}`,
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
