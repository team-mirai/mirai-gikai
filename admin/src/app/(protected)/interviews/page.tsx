import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { AllInterviewConfigList } from "@/features/interviews/server/components/all-interview-config-list";
import {
  getAllInterviewConfigs,
  getAllSessionCounts,
} from "@/features/interviews/server/loaders/get-all-interview-configs";
import { routes } from "@/lib/routes";

export default async function InterviewsPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect(routes.login());
  }

  const [configs, sessionCounts] = await Promise.all([
    getAllInterviewConfigs(),
    getAllSessionCounts(),
  ]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">インタビュー管理</h1>

      <section className="rounded-lg border bg-white p-6">
        <AllInterviewConfigList
          configs={configs}
          sessionCounts={sessionCounts}
        />
      </section>
    </div>
  );
}
