import { MessageSquareMore } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SpeechBubble } from "@/components/ui/speech-bubble";
import { getInterviewChatLogLink } from "@/features/interview-config/shared/utils/interview-links";
import { ReactionButtonsInline } from "@/features/report-reaction/client/components/reaction-buttons-inline";
import type { ReportReactionData } from "@/features/report-reaction/shared/types";
import { ShareArticleButton } from "../../client/components/share-article-button";
import { BackToBillButton } from "./back-to-bill-button";
import { IntervieweeInfo } from "./interviewee-info";
import type { Opinion } from "./opinions-list";
import { OpinionsList } from "./opinions-list";
import { ReportBreadcrumb } from "./report-breadcrumb";
import { ReportMetaInfo } from "./report-meta-info";
import { ReportProblemButton } from "./report-problem-button";

interface ReportContentProps {
  reportId: string;
  billId: string;
  summary: string | null;
  stance: string | null;
  role: string | null;
  roleTitle?: string | null;
  sessionStartedAt: string | null;
  characterCount: number;
  roleDescription: string | null;
  opinions: Opinion[];
  /** リアクションデータ（公開レポートで使用） */
  reactionData?: ReportReactionData;
  /** 遷移元のコンテキスト。"complete" の場合、会話ログへのリンクに ?from=complete を付与。"opinions" の場合、戻るボタンがレポート一覧を指す */
  from?: "complete" | "opinions";
  /** 意見リストの後に差し込む追加セクション（有識者登録バナーなど） */
  children?: ReactNode;
  /** 共有ボタン用の情報 */
  share?: {
    billName: string;
    shareUrl: string;
    ogImageUrl: string;
    shareMessage?: string | null;
  };
}

export function ReportContent({
  reportId,
  billId,
  summary,
  stance,
  role,
  roleTitle,
  sessionStartedAt,
  characterCount,
  roleDescription,
  opinions,
  reactionData,
  from,
  children,
  share,
}: ReportContentProps) {
  return (
    <div className="flex flex-col gap-12">
      {/* 要約カード */}
      <div className="flex flex-col items-center gap-12">
        <SpeechBubble className="px-7 py-5">
          <p className="text-[18px] font-bold text-black leading-[28px] relative">
            {summary}
          </p>
        </SpeechBubble>

        {/* スタンスと日時情報 */}
        <ReportMetaInfo
          reportId={reportId}
          stance={stance}
          role={role}
          roleTitle={roleTitle}
          sessionStartedAt={sessionStartedAt}
          characterCount={characterCount}
          from={from === "complete" ? "complete" : undefined}
        />

        {/* 参考になるボタン */}
        {reactionData && (
          <ReactionButtonsInline
            reportId={reportId}
            initialData={reactionData}
          />
        )}
      </div>

      {/* インタビューを受けた人 */}
      <IntervieweeInfo roleDescription={roleDescription} headingLevel="h3" />

      {/* 主な意見 */}
      <OpinionsList
        opinions={opinions}
        title="💬主な意見"
        reportId={reportId}
        chatLogFrom={from === "complete" ? "complete" : undefined}
        footer={
          <Link
            href={
              getInterviewChatLogLink(
                reportId,
                from === "complete" ? "complete" : undefined
              ) as Route
            }
            className="flex items-center justify-center gap-2.5 px-6 py-3 border border-gray-800 rounded-full"
          >
            <MessageSquareMore className="w-6 h-6 text-gray-800" />
            <span className="text-base font-bold text-gray-800">
              すべての会話ログを読む
            </span>
          </Link>
        }
      />

      {/* 追加セクション（有識者登録バナーなど） */}
      {children}

      <div className="flex flex-col gap-3 items-center">
        {/* 記事を共有するボタン */}
        {share && (
          <ShareArticleButton
            billName={share.billName}
            shareUrl={share.shareUrl}
            ogImageUrl={share.ogImageUrl}
            shareMessage={share.shareMessage}
          />
        )}
        {/* 法案の記事に戻るボタン */}
        <BackToBillButton billId={billId} from={from} />
        {/* 問題を報告する */}
        <ReportProblemButton />
      </div>

      {/* パンくずリスト */}
      <ReportBreadcrumb billId={billId} />
    </div>
  );
}
