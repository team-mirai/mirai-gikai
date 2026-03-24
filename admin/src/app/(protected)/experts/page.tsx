import { redirect } from "next/navigation";
import { ExpertList } from "@/features/experts/server/components/expert-list";
import { loadExperts } from "@/features/experts/server/loaders/load-experts";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";

export default async function ExpertsPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect(routes.login());
  }

  const experts = await loadExperts();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">有識者管理</h1>

      <section className="rounded-lg border bg-white p-6">
        <ExpertList experts={experts} />
      </section>
    </div>
  );
}
