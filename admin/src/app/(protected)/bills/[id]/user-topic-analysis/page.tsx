import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { UserTopicAnalysisPage } from "@/features/user-topic-analysis/server/components/user-topic-analysis-page";
import { routes } from "@/lib/routes";

export default async function BillUserTopicAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    redirect(routes.login());
  }
  const { id } = await params;
  return <UserTopicAnalysisPage billId={id} />;
}
