import type { Metadata } from "next";
import { ReportChatLogPage } from "@/features/interview-report/server/components/report-chat-log-page";

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

  return (
    <ReportChatLogPage
      reportId={reportId}
      from={from === "complete" ? "complete" : undefined}
    />
  );
}
