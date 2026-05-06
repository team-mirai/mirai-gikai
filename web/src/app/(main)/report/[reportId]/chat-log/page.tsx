import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { ReportChatLogPage } from "@/features/interview-report/server/components/report-chat-log-page";
import { routes } from "@/lib/routes";

interface ChatLogPageProps {
  params: Promise<{
    reportId: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

export const metadata: Metadata = {
  title: "会話ログ - インタビューレポート",
  description: "AIインタビューの会話ログ",
};

export default async function ChatLogPage({
  params,
  searchParams,
}: ChatLogPageProps) {
  const { reportId } = await params;
  const { from } = await searchParams;

  if (from !== "complete") {
    const publicReportPath =
      from === "opinions"
        ? `${routes.publicReport(reportId)}?from=opinions#chat-log`
        : `${routes.publicReport(reportId)}#chat-log`;

    redirect(publicReportPath as Route);
  }

  return <ReportChatLogPage reportId={reportId} from="complete" />;
}
