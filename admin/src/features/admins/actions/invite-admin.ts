"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import type { InviteAdminInput } from "../types";

export async function inviteAdmin(input: InviteAdminInput) {
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

    // 新規ユーザー: 招待メール送信
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      if (inviteError.message.includes("already been registered")) {
        return { error: "このメールアドレスは既に登録されています" };
      }
      return {
        error: `招待メールの送信に失敗しました: ${inviteError.message}`,
      };
    }

    // app_metadataにadminロールを設定
    if (inviteData?.user) {
      await supabase.auth.admin.updateUserById(inviteData.user.id, {
        app_metadata: { roles: ["admin"] },
      });
    }

    revalidatePath("/admins");
    return { success: true };
  } catch (error) {
    console.error("Invite admin error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "管理者の招待中にエラーが発生しました" };
  }
}
