import "server-only";

import { notFound } from "next/navigation";
import { AnalysisReport } from "../../client/components/analysis-report";
import { getTopicAnalysisDetail } from "../loaders/get-topic-analysis-detail";
import { TopicAnalysisHeader } from "./topic-analysis-header";

interface TopicAnalysisDetailPageContentProps {
  billId: string;
  versionId: string;
}

export async function TopicAnalysisDetailPageContent({
  billId,
  versionId,
}: TopicAnalysisDetailPageContentProps) {
  const detail = await getTopicAnalysisDetail(versionId);

  if (!detail || detail.version.bill_id !== billId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TopicAnalysisHeader
        billId={billId}
        billName={`トピック解析 v${detail.version.version}`}
        showBackToAnalysis
      />
      <AnalysisReport version={detail.version} topics={detail.topics} />
    </div>
  );
}
