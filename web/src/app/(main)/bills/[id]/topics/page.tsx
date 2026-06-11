import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { TopicListPage } from "@/features/user-topic-analysis/server/components/topic-list-page";

interface TopicsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TopicsPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);
  const title = bill?.bill_content?.title || bill?.name || "法案";

  return {
    title: `法案のトピック一覧 - ${title}`,
    description: `${title}に寄せられた意見をAIが整理したトピック一覧`,
  };
}

export default async function TopicsPage({ params }: TopicsPageProps) {
  const { id } = await params;
  return <TopicListPage billId={id} />;
}
