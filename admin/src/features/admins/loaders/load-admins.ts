import { createAdminClient } from "@mirai-gikai/supabase";
import type { Admin } from "../types";

export async function loadAdmins(): Promise<Admin[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(`管理者一覧の取得に失敗しました: ${error.message}`);
  }

  const admins: Admin[] = (data?.users ?? [])
    .filter((user) => {
      const roles = user.app_metadata?.roles || [];
      return roles.includes("admin");
    })
    .map((user) => ({
      id: user.id,
      email: user.email ?? "",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return admins;
}
