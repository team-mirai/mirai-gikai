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
    from?: string | string[];
    quote?: string | string[];
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
  const { from, quote } = await searchParams;
  // 同一キーが複数指定されると配列になり得るため、先頭の値に正規化する。
  const fromValue = Array.isArray(from) ? from[0] : from;
  const quoteValue = Array.isArray(quote) ? quote[0] : quote;
  return (
    <PublicReportPage
      reportId={reportId}
      from={fromValue === "opinions" ? "opinions" : undefined}
      highlightQuote={quoteValue}
    />
  );
}
