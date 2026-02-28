import { ReportCompletePage } from "@/features/interview-report/server/components/report-complete-page";

interface InterviewReportPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function InterviewReportPage({
  params,
}: InterviewReportPageProps) {
  const { reportId } = await params;

  return <ReportCompletePage reportId={reportId} />;
}
