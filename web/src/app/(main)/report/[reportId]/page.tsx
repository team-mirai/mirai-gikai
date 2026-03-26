import type { Metadata } from "next";
import { PublicReportPage } from "@/features/interview-report/server/components/public-report-page";
import { getPublicReportById } from "@/features/interview-report/server/loaders/get-public-report-by-id";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

interface PublicReportRouteProps {
  params: Promise<{
    reportId: string;
  }>;
  searchParams: Promise<{
    from?: string;
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

  const ogTitle =
    data.summary || `${stanceText} - ${billName} インタビューレポート`;
  const ogDescription = `${billName}に対するインタビューレポート`;
  const shareImageUrl = new URL(
    `/api/og/report?id=${reportId}`,
    env.webUrl
  ).toString();

  return {
    title: ogTitle,
    description: ogDescription,
    alternates: {
      canonical: routes.publicReport(reportId),
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
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
      title: ogTitle,
      description: ogDescription,
      images: [shareImageUrl],
    },
  };
}

export default async function PublicReportRoute({
  params,
  searchParams,
}: PublicReportRouteProps) {
  const { reportId } = await params;
  const { from } = await searchParams;
  return (
    <PublicReportPage
      reportId={reportId}
      from={from === "opinions" ? "opinions" : undefined}
    />
  );
}
