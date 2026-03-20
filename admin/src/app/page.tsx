import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";

export default async function HomePage() {
  const admin = await getCurrentAdmin();

  // 管理者としてログイン済みの場合はダッシュボードへ
  if (admin) {
    redirect(routes.bills());
  }

  // 未ログインまたは管理者でない場合はログイン画面へ
  redirect(routes.login());
}
