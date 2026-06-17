import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { resolveBillShareImageUrl } from "@/features/bills/shared/utils/bill-share-image";
import { TopicListPage } from "@/features/user-topic-analysis/server/components/topic-list-page";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

interface TopicsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TopicsPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);
  const billName = bill?.bill_content?.title || bill?.name || "法案";
  const title = `法案のトピック一覧 - ${billName}`;
  const description = `${billName}に寄せられた意見をAIが整理したトピック一覧`;
  const shareImageUrl = resolveBillShareImageUrl(bill, env.webUrl);

  return {
    title,
    description,
    alternates: {
      canonical: routes.billTopics(id),
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: shareImageUrl,
          alt: `${billName} のOGPイメージ`,
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

export default async function TopicsPage({ params }: TopicsPageProps) {
  const { id } = await params;
  return <TopicListPage billId={id} />;
}
