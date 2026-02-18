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

    // パスワード指定で管理者ユーザーを作成
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { roles: ["admin"] },
    });

    if (createError) {
      // 既存ユーザーの場合、admin ロールを付与して昇格
      if (
        createError.message.includes("already been registered") ||
        createError.message.includes("already exists")
      ) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users?.find((u) => u.email === email);
        if (!existing) {
          return {
            error:
              "このメールアドレスは既に登録されていますが、ユーザー情報を取得できませんでした",
          };
        }
        const roles: string[] =
          (existing.app_metadata?.roles as string[]) ?? [];
        if (roles.includes("admin")) {
          return {
            error: "このメールアドレスは既に管理者として登録されています",
          };
        }
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existing.id,
          {
            app_metadata: { roles: [...roles, "admin"] },
          }
        );
        if (updateError) {
          return {
            error: `管理者権限の付与に失敗しました: ${updateError.message}`,
          };
        }
      } else {
        return {
          error: `管理者の作成に失敗しました: ${createError.message}`,
        };
      }
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
