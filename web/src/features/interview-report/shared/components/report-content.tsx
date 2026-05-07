import type { ReactNode } from "react";
import { SpeechBubble } from "@/components/ui/speech-bubble";
import type { ReportReactionData } from "@/features/report-reaction/shared/types";
import { ShareArticleButton } from "../../client/components/share-article-button";
import { BackToBillButton } from "./back-to-bill-button";
import { ChatLogSection } from "./chat-log-section";
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
  messages?: Array<{
    id: string;
    role: string;
    content: string;
  }>;
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
  messages,
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
          reactionData={reactionData}
          from={from}
        />
      </div>

      {/* インタビューを受けた人 */}
      <IntervieweeInfo roleDescription={roleDescription} headingLevel="h3" />

      {/* 主な意見 */}
      <OpinionsList
        opinions={opinions}
        title="💬主な意見"
        reportId={reportId}
        chatLogFrom={from}
      />

      {messages && messages.length > 0 && (
        <ChatLogSection messages={messages} />
      )}

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
