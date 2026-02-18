import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/features/auth/lib/auth-server";
import { AdminList } from "@/features/admins/components/admin-list";
import { InviteAdminForm } from "@/features/admins/components/invite-admin-form";
import { loadAdmins } from "@/features/admins/loaders/load-admins";

export default async function AdminsPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect("/login");
  }

  const admins = await loadAdmins();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">管理者管理</h1>

      {/* 管理者追加セクション */}
      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">管理者を追加</h2>
        <InviteAdminForm />
      </section>

      {/* 管理者一覧セクション */}
      <section className="rounded-lg border bg-white p-6">
        <AdminList admins={admins} currentAdminId={currentAdmin.id} />
      </section>
    </div>
  );
}
