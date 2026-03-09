import type { Metadata } from "next";
import { PublicReportPage } from "@/features/interview-report/server/components/public-report-page";
import { getPublicReportById } from "@/features/interview-report/server/loaders/get-public-report-by-id";

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

  return {
    title: `${stanceText} - ${billName} インタビューレポート`,
    description: data.summary || `${billName}に対するインタビューレポート`,
  };
}

export default async function PublicReportRoute({
  params,
}: PublicReportRouteProps) {
  const { reportId } = await params;
  return <PublicReportPage reportId={reportId} />;
}
