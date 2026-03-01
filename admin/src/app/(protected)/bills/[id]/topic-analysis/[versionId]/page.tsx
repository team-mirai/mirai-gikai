import { notFound } from "next/navigation";

import { AnalysisReport } from "@/features/topic-analysis/client/components/analysis-report";
import { TopicAnalysisHeader } from "@/features/topic-analysis/server/components/topic-analysis-header";
import { getTopicAnalysisDetail } from "@/features/topic-analysis/server/loaders/get-topic-analysis-detail";

interface TopicAnalysisDetailPageProps {
  params: Promise<{ id: string; versionId: string }>;
}

export default async function TopicAnalysisDetailPage({
  params,
}: TopicAnalysisDetailPageProps) {
  const { id, versionId } = await params;

  const detail = await getTopicAnalysisDetail(versionId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TopicAnalysisHeader
        billId={id}
        billName={`トピック解析 v${detail.version.version}`}
        showBackToAnalysis
      />
      <AnalysisReport version={detail.version} topics={detail.topics} />
    </div>
  );
}
