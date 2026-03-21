import type { Metadata } from "next";
import { PublicReportPage } from "@/features/interview-report/server/components/public-report-page";
import { getPublicReportById } from "@/features/interview-report/server/loaders/get-public-report-by-id";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

interface PublicReportRouteProps {
  params: Promise<{
    reportId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicReportRouteProps): Promise<Metadata> {
  const { reportId } = await params;
  const data = await getPublicReportById(reportId);

  if (!data) {
    return { title: "インタビューレポート" };
  }

  const billName = data.bill.bill_content?.title || data.bill.name || "法案";
  const stanceText =
    data.stance === "for"
      ? "期待"
      : data.stance === "against"
        ? "懸念"
        : "意見";

  const title = `${stanceText} - ${billName} インタビューレポート`;
  const description = data.summary || `${billName}に対するインタビューレポート`;
  const defaultOgpUrl = new URL("/ogp.jpg", env.webUrl).toString();
  const shareImageUrl =
    data.bill.share_thumbnail_url || data.bill.thumbnail_url || defaultOgpUrl;

  return {
    title,
    description,
    alternates: {
      canonical: routes.publicReport(reportId),
    },
    openGraph: {
      title,
      description,
      type: "article",
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

export default async function PublicReportRoute({
  params,
}: PublicReportRouteProps) {
  const { reportId } = await params;
  return <PublicReportPage reportId={reportId} />;
}
