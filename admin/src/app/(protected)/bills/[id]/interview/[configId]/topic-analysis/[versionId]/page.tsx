import { TopicAnalysisDetailPageContent } from "@/features/topic-analysis/server/components/topic-analysis-detail-page";

interface TopicAnalysisDetailPageProps {
  params: Promise<{ id: string; configId: string; versionId: string }>;
}

export default async function TopicAnalysisDetailPage({
  params,
}: TopicAnalysisDetailPageProps) {
  const { id, configId, versionId } = await params;
  return (
    <TopicAnalysisDetailPageContent
      billId={id}
      configId={configId}
      versionId={versionId}
    />
  );
}
