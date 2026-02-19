import { unstable_noStore as noStore } from "next/cache";
import type { Admin } from "../types";
import { findAdminUsers } from "../repositories/admin-repository";

export async function loadAdmins(): Promise<Admin[]> {
  noStore();

  const data = await findAdminUsers();

  return (data ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
  }));
}
