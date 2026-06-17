import "server-only";

import { Undo2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { ShareArticleButton } from "@/features/interview-report/client/components/share-article-button";
import { routes } from "@/lib/routes";
import { getOrigin } from "@/lib/utils/url";
import { BackToBillButton } from "../../shared/components/back-to-bill-button";
import { ChatLogSection } from "../../shared/components/chat-log-section";
import { ReportIntervieweeCard } from "../../shared/components/report-interviewee-card";
import { ReportMainOpinions } from "../../shared/components/report-main-opinions";
import { ReportProblemButton } from "../../shared/components/report-problem-button";
import { parseOpinions } from "../../shared/utils/format-utils";
import { getPublicReportById } from "../loaders/get-public-report-by-id";

interface PublicReportPageProps {
  reportId: string;
  from?: "opinions";
  /** 引用元の逐語テキスト。会話ログ内の該当箇所を太字表示する。 */
  highlightQuote?: string;
}

export async function PublicReportPage({
  reportId,
  from,
  highlightQuote,
}: PublicReportPageProps) {
  const data = await getPublicReportById(reportId);

  if (!data) {
    notFound();
  }

  const interviewConfig = await getInterviewConfig(data.bill_id);
  const billName = data.bill.bill_content?.title || data.bill.name;
  const opinions = parseOpinions(data.opinions);
  const origin = await getOrigin();
  const shareUrl = `${origin}${routes.publicReport(reportId)}`;
  const ogImageUrl = `${origin}/api/og/report?id=${reportId}`;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "法案詳細", href: routes.billDetail(data.bill_id) },
    { label: "レポート詳細" },
  ];

  return (
    <div className="min-h-dvh bg-mirai-surface">
      <Container>
        <div className="flex flex-col gap-8 py-8">
          {/* パンくず + 法案タイトル */}
          <div className="flex flex-col gap-2">
            <Breadcrumb items={breadcrumbItems} />
            <Link
              href={routes.billDetail(data.bill_id) as Route}
              className="inline-flex items-center gap-2 text-[15px] font-medium leading-6 text-black"
            >
              <span className="underline">{billName}</span>
              <Undo2 className="size-4 shrink-0" />
            </Link>
          </div>

          <h1 className="text-[22px] font-bold leading-9 text-mirai-text">
            💬インタビューレポート
          </h1>

          {/* 回答者カード */}
          <ReportIntervieweeCard
            roleTitle={data.role_title}
            roleDescription={data.role_description}
            stance={data.stance}
            role={data.role}
            sessionStartedAt={data.session_started_at}
            sessionCompletedAt={data.session_completed_at}
            characterCount={data.characterCount}
          />

          {/* 主な意見 */}
          <ReportMainOpinions opinions={opinions} reportId={reportId} />

          {/* すべての会話ログ */}
          {data.messages.length > 0 && (
            <ChatLogSection
              messages={data.messages}
              highlightQuote={highlightQuote}
            />
          )}

          {/* AIインタビューCTA */}
          {interviewConfig != null && (
            <InterviewLandingSection billId={data.bill_id} />
          )}

          {/* アクション */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <ShareArticleButton
              billName={billName}
              shareUrl={shareUrl}
              ogImageUrl={ogImageUrl}
              shareMessage={data.summary}
            />
            <ReportProblemButton />
            <BackToBillButton billId={data.bill_id} from={from} />
          </div>
        </div>
      </Container>
    </div>
  );
}
