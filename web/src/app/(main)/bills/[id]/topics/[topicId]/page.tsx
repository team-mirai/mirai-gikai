import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { resolveBillShareImageUrl } from "@/features/bills/shared/utils/bill-share-image";
import { TopicDetailPage } from "@/features/user-topic-analysis/server/components/topic-detail-page";
import { getPublicTopicDetail } from "@/features/user-topic-analysis/server/loaders/get-public-topic-detail";
import { parseTopicFilter } from "@/features/user-topic-analysis/shared/utils/filter-topics";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

interface TopicDetailRouteProps {
  params: Promise<{ id: string; topicId: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export async function generateMetadata({
  params,
}: TopicDetailRouteProps): Promise<Metadata> {
  const { id, topicId } = await params;
  // タイトル/説明はフィルタに依存しないため絞り込みなし（all）で取得する。
  // DB取得は getPublicTopicAnalysis の React cache() でページ本体と共有され、
  // リクエスト内で重複クエリにならない。
  const [bill, location] = await Promise.all([
    getBillById(id),
    getPublicTopicDetail(id, topicId),
  ]);
  const billName = bill?.bill_content?.title || bill?.name || "法案";
  const topic = location?.topic;

  const title = topic
    ? `${topic.title} - ${billName}`
    : `トピック詳細 - ${billName}`;
  const description =
    topic?.description || `${billName}に寄せられた意見トピックの詳細`;
  const shareImageUrl = resolveBillShareImageUrl(bill, env.webUrl);

  return {
    title,
    description,
    alternates: {
      canonical: routes.billTopicDetail(id, topicId),
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: shareImageUrl,
          alt: `${title} のOGPイメージ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImageUrl],
    },
  };
}

export default async function TopicDetailRoute({
  params,
  searchParams,
}: TopicDetailRouteProps) {
  const { id, topicId } = await params;
  const { filter } = await searchParams;
  return (
    <TopicDetailPage
      billId={id}
      topicId={topicId}
      filter={parseTopicFilter(filter)}
    />
  );
}
