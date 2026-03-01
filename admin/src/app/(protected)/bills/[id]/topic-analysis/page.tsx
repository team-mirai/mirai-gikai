import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { RunAnalysisButton } from "@/features/topic-analysis/client/components/run-analysis-button";
import { TopicAnalysisHeader } from "@/features/topic-analysis/server/components/topic-analysis-header";
import { VersionList } from "@/features/topic-analysis/server/components/version-list";
import { getTopicAnalysisVersions } from "@/features/topic-analysis/server/loaders/get-topic-analysis-versions";

interface TopicAnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicAnalysisPage({
  params,
}: TopicAnalysisPageProps) {
  const { id } = await params;

  const [bill, versions] = await Promise.all([
    getBillById(id),
    getTopicAnalysisVersions(id),
  ]);

  if (!bill) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TopicAnalysisHeader billId={id} billName={bill.name} />
      <RunAnalysisButton billId={id} />
      <VersionList versions={versions} billId={id} />
    </div>
  );
}
