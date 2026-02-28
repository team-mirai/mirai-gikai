import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { InterviewLPPage } from "@/features/interview-config/client/components/interview-lp-page";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getLatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import { env } from "@/lib/env";

interface InterviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: InterviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  const billName = bill.bill_content?.title ?? bill.name;
  const description = `法案についてのAIインタビュー - ${billName}`;
  const defaultOgpUrl = new URL("/ogp.jpg", env.webUrl).toString();
  const shareImageUrl =
    bill.share_thumbnail_url || bill.thumbnail_url || defaultOgpUrl;

  return {
    title: `AIインタビュー - ${billName}`,
    description: description,
    alternates: {
      canonical: `/bills/${bill.id}/interview`,
    },
    openGraph: {
      title: `AIインタビュー - ${billName}`,
      description: description,
      type: "website",
      images: [
        {
          url: shareImageUrl,
          alt: `${billName} のAIインタビューページ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `AIインタビュー - ${billName}`,
      description: description,
      images: [shareImageUrl],
    },
  };
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { id } = await params;
  const [bill, interviewConfig] = await Promise.all([
    getBillById(id),
    getInterviewConfig(id),
  ]);

  if (!bill) {
    notFound();
  }

  if (!interviewConfig) {
    notFound();
  }

  // 最新のセッション情報を取得
  const latestSession = await getLatestInterviewSession(interviewConfig.id);

  return (
    <InterviewLPPage
      bill={bill}
      interviewConfig={interviewConfig}
      sessionInfo={latestSession}
    />
  );
}
