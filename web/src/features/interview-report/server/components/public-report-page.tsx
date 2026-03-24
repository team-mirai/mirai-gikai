import "server-only";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { ReactionButtons } from "@/features/report-reaction/client/components/reaction-buttons";
import { getReportReactions } from "@/features/report-reaction/server/loaders/get-report-reactions";
import { getOrigin } from "@/lib/utils/url";
import { routes } from "@/lib/routes";
import { ReportChatClient } from "../../client/components/report-chat-client";
import { ReportContent } from "../../shared/components/report-content";
import { parseOpinions } from "../../shared/utils/format-utils";
import { calculateDuration } from "../../shared/utils/report-utils";
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
  const duration = calculateDuration(
    data.session_started_at,
    data.session_completed_at
  );

  const [
    reactionData,
    origin,
    billWithContent,
    currentDifficulty,
    interviewConfig,
  ] = await Promise.all([
    getReportReactions(reportId),
    getOrigin(),
    getBillById(data.bill_id),
    getDifficultyLevel(),
    getInterviewConfig(data.bill_id),
  ]);
  const shareUrl = `${origin}${routes.publicReport(reportId)}`;

  return (
    <div className="min-h-dvh bg-mirai-surface pb-20">
      {/* 法案サムネイル画像 */}
      {data.bill.thumbnail_url && (
        <div className="relative w-full h-[320px]">
          <Image
            src={data.bill.thumbnail_url}
            alt={billName}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* ヘッダーセクション */}
      <div className="px-4 pt-8 pb-4">
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
      <div className="px-4 pt-8 pb-28">
        <ReportContent
          reportId={reportId}
          billId={data.bill_id}
          summary={data.summary}
          stance={data.stance}
          role={data.role}
          roleTitle={data.role_title}
          sessionStartedAt={data.session_started_at}
          duration={duration}
          characterCount={data.characterCount}
          roleDescription={data.role_description}
          opinions={opinions}
        />
      </div>

      {/* アクションバー - Fixed at bottom */}
      <ReactionButtons
        reportId={reportId}
        initialData={reactionData}
        billName={billName}
        shareUrl={shareUrl}
        thumbnailUrl={data.bill.thumbnail_url}
        shareMessage={data.summary}
      />

      {/* AIチャット */}
      {billWithContent && (
        <ReportChatClient
          billContext={billWithContent}
          hasInterviewConfig={interviewConfig != null}
          difficultyLevel={currentDifficulty}
        />
      )}
    </div>
  );
}
