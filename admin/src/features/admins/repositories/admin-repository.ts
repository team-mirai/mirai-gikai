import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";

export async function findAdminUsers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_admin_users");

  if (error) {
    throw new Error(`Failed to fetch admin users: ${error.message}`);
  }
  return data;
}

export async function createAuthUser(params: {
  email: string;
  password: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    app_metadata: { roles: ["admin"] },
  });

  if (error) {
    throw error;
  }
}

export async function deleteAuthUser(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }
}
