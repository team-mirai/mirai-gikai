import type { User } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { Admin } from "../types";

async function listAllUsers(): Promise<User[]> {
  noStore();
  const supabase = createAdminClient();
  const allUsers: User[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`管理者一覧の取得に失敗しました: ${error.message}`);
    }

    const users = data?.users ?? [];
    allUsers.push(...users);

    if (users.length < perPage) {
      break;
    }

    page++;
  }

  return allUsers;
}

export async function loadAdmins(): Promise<Admin[]> {
  const users = await listAllUsers();

  const admins: Admin[] = users
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
