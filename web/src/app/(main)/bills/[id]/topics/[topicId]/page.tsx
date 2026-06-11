import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { TopicDetailPage } from "@/features/user-topic-analysis/server/components/topic-detail-page";

interface TopicDetailRouteProps {
  params: Promise<{ id: string; topicId: string }>;
}

export async function generateMetadata({
  params,
}: TopicDetailRouteProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);
  const title = bill?.bill_content?.title || bill?.name || "法案";

  return {
    title: `トピック詳細 - ${title}`,
    description: `${title}に寄せられた意見トピックの詳細`,
  };
}

export default async function TopicDetailRoute({
  params,
}: TopicDetailRouteProps) {
  const { id, topicId } = await params;
  return <TopicDetailPage billId={id} topicId={topicId} />;
}
