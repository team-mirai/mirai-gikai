import { TopicAnalysisDetailPageContent } from "@/features/topic-analysis/server/components/topic-analysis-detail-page";

interface TopicAnalysisDetailPageProps {
  params: Promise<{ id: string; versionId: string }>;
}

export default async function TopicAnalysisDetailPage({
  params,
}: TopicAnalysisDetailPageProps) {
  const { id, versionId } = await params;
  return <TopicAnalysisDetailPageContent billId={id} versionId={versionId} />;
}
