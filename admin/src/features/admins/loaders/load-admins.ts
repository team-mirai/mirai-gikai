import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { Admin } from "../types";

export async function loadAdmins(): Promise<Admin[]> {
  noStore();
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_admin_users");

  if (error) {
    throw new Error(`管理者一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
  }));
}
