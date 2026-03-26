import "server-only";

import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { ReactionButtons } from "@/features/report-reaction/client/components/reaction-buttons";
import { getReportReactions } from "@/features/report-reaction/server/loaders/get-report-reactions";
import { routes } from "@/lib/routes";
import { getOrigin } from "@/lib/utils/url";
import { ReportContent } from "../../shared/components/report-content";
import { parseOpinions } from "../../shared/utils/format-utils";
import { getPublicReportById } from "../loaders/get-public-report-by-id";

interface PublicReportPageProps {
  reportId: string;
}

export async function PublicReportPage({ reportId }: PublicReportPageProps) {
  const data = await getPublicReportById(reportId);

  if (!data) {
    notFound();
  }

  const billName = data.bill.bill_content?.title || data.bill.name;
  const opinions = parseOpinions(data.opinions);

  const [reactionData, origin] = await Promise.all([
    getReportReactions(reportId),
    getOrigin(),
  ]);
  const shareUrl = `${origin}${routes.publicReport(reportId)}`;
  const ogImageUrl = `${origin}/api/og/report?id=${reportId}`;

  return (
    <div className="min-h-dvh bg-mirai-surface pb-12 pt-20 md:pt-4">
      {/* ヘッダーセクション */}
      <div className="px-4 pt-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            インタビューレポート
          </h1>
          <Link
            href={getBillDetailLink(data.bill_id) as Route}
            className="text-sm text-black underline"
          >
            {billName}
          </Link>
        </div>
      </div>

      {/* レポート本体（共通コンポーネント） */}
      <div className="px-4 pt-8">
        <ReportContent
          reportId={reportId}
          billId={data.bill_id}
          summary={data.summary}
          stance={data.stance}
          role={data.role}
          roleTitle={data.role_title}
          sessionStartedAt={data.session_started_at}
          characterCount={data.characterCount}
          roleDescription={data.role_description}
          opinions={opinions}
          reactionData={reactionData}
          share={{
            billName,
            shareUrl,
            ogImageUrl,
            shareMessage: data.summary,
          }}
        />
      </div>

      {/* アクションバー - Fixed at bottom */}
      <ReactionButtons
        reportId={reportId}
        initialData={reactionData}
        billName={billName}
        shareUrl={shareUrl}
        ogImageUrl={ogImageUrl}
        shareMessage={data.summary}
      />
    </div>
  );
}
