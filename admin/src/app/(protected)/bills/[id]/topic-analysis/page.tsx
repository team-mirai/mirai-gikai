import { TopicAnalysisPageContent } from "@/features/topic-analysis/server/components/topic-analysis-page";

interface TopicAnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicAnalysisPage({
  params,
}: TopicAnalysisPageProps) {
  const { id } = await params;
  return <TopicAnalysisPageContent billId={id} />;
}
