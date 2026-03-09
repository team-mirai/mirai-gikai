import { checkAdminPermission } from "@/lib/auth/permissions";
import { createAuthClient } from "@/lib/supabase/auth";

/**
 * 現在のユーザーが管理者権限を持っているかチェックする
 * @returns 管理者の場合はuser、そうでない場合はnull
 */
export async function getCurrentAdmin() {
  const authClient = await createAuthClient();
  const res = await authClient.getUser();
  const user = res.data.user;

  if (!user || !checkAdminPermission(user)) {
    return null;
  }

  return user;
}

/**
 * 現在のユーザーが管理者としてログインしているかチェックする
 * 管理者でない場合はエラーを投げる
 */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("管理者権限が必要です");
  }

  return admin;
}
