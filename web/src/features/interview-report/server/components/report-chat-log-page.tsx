import "server-only";

import { ChevronLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBillDetailLink,
  getInterviewReportCompleteLink,
  getPublicReportLink,
} from "@/features/interview-config/shared/utils/interview-links";
import { ReactionButtons } from "@/features/report-reaction/client/components/reaction-buttons";
import { getReportReactions } from "@/features/report-reaction/server/loaders/get-report-reactions";
import { routes } from "@/lib/routes";
import { getOrigin } from "@/lib/utils/url";
import { BackToReportButton } from "../../shared/components/back-to-report-button";
import { ChatLogSection } from "../../shared/components/chat-log-section";
import { OpinionsList } from "../../shared/components/opinions-list";
import { ReportBreadcrumb } from "../../shared/components/report-breadcrumb";
import { ReportMetaInfo } from "../../shared/components/report-meta-info";
import { ReportProblemButton } from "../../shared/components/report-problem-button";
import { parseOpinions } from "../../shared/utils/format-utils";
import { countCharacters } from "../../shared/utils/report-utils";
import { getReportWithMessages } from "../loaders/get-report-with-messages";

interface ReportChatLogPageProps {
  reportId: string;
  from?: "complete";
}

export async function ReportChatLogPage({
  reportId,
  from,
}: ReportChatLogPageProps) {
  const data = await getReportWithMessages(reportId);

  if (!data) {
    notFound();
  }

  const { report, messages, bill } = data;
  const billName = bill.bill_content?.title || bill.name;
  const characterCount = countCharacters(messages);
  const opinions = parseOpinions(report.opinions);
  const [reactionData, origin] = await Promise.all([
    getReportReactions(reportId),
    getOrigin(),
  ]);
  const shareUrl = `${origin}${routes.publicReport(reportId)}`;
  const reportHref =
    from === "complete"
      ? getInterviewReportCompleteLink(reportId)
      : getPublicReportLink(reportId);

  return (
    <div className="min-h-dvh bg-mirai-surface pt-20 md:pt-4">
      {/* Back to Report Link */}
      <div className="px-4 pt-4">
        <Link
          href={reportHref as Route}
          className="inline-flex items-center gap-1 text-sm font-medium text-mirai-text-secondary"
        >
          <ChevronLeft size={20} />
          レポートに戻る
        </Link>
      </div>

      {/* Header Section */}
      <div className="px-4 pt-8 pb-8">
        <div className="flex flex-col items-center">
          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-800">
            実際のインタビュー
          </h1>

          {/* Bill Name */}
          <Link
            href={getBillDetailLink(report.bill_id) as Route}
            className="text-sm text-black underline mt-2"
          >
            {billName}
          </Link>

          {/* Stance and Meta Info */}
          <div className="mt-8">
            <ReportMetaInfo
              reportId={report.id}
              stance={report.stance}
              role={report.role}
              roleTitle={report.role_title}
              sessionStartedAt={report.session_started_at}
              characterCount={characterCount}
              disableLink
            />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-4 py-8">
        <div className="flex flex-col gap-9">
          <ChatLogSection messages={messages} />

          {/* Opinions Section */}
          <OpinionsList opinions={opinions} />

          {/* Back to Report / Bill Buttons */}
          <div className="flex flex-col gap-3">
            <BackToReportButton href={reportHref} />
            <ReportProblemButton />
          </div>

          {/* Breadcrumb Navigation */}
          <ReportBreadcrumb
            billId={report.bill_id}
            reportHref={reportHref}
            additionalItems={[{ label: "すべての会話ログ" }]}
          />
        </div>
      </div>

      {/* Reaction Buttons - Fixed at bottom */}
      <ReactionButtons
        reportId={reportId}
        initialData={reactionData}
        billName={billName}
        shareUrl={shareUrl}
        ogImageUrl={`${origin}/api/og/report?id=${reportId}`}
        shareMessage={report.summary}
        showShare={report.is_public_by_user && report.is_public_by_admin}
        showReaction={from !== "complete"} // 完了ページからはリアクション非表示
      />
    </div>
  );
}
