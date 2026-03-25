import type { ReactNode } from "react";
import type { Route } from "next";
import { MessageSquareMore } from "lucide-react";
import Link from "next/link";
import { SpeechBubble } from "@/components/ui/speech-bubble";
import { getInterviewChatLogLink } from "@/features/interview-config/shared/utils/interview-links";
import type { Opinion } from "./opinions-list";
import { BackToBillButton } from "./back-to-bill-button";
import { IntervieweeInfo } from "./interviewee-info";
import { OpinionsList } from "./opinions-list";
import { ReportBreadcrumb } from "./report-breadcrumb";
import { ReportMetaInfo } from "./report-meta-info";

interface ReportContentProps {
  reportId: string;
  billId: string;
  summary: string | null;
  stance: string | null;
  role: string | null;
  roleTitle?: string | null;
  sessionStartedAt: string | null;
  duration?: string;
  characterCount: number;
  roleDescription: string | null;
  opinions: Opinion[];
  /** 遷移元のコンテキスト。"complete" の場合、会話ログへのリンクに ?from=complete を付与 */
  from?: "complete";
  /** 意見リストの後に差し込む追加セクション（有識者登録バナーなど） */
  children?: ReactNode;
}

export function ReportContent({
  reportId,
  billId,
  summary,
  stance,
  role,
  roleTitle,
  sessionStartedAt,
  duration,
  characterCount,
  roleDescription,
  opinions,
  from,
  children,
}: ReportContentProps) {
  return (
    <div className="flex flex-col gap-12">
      {/* 要約カード */}
      <div className="flex flex-col items-center gap-12">
        <SpeechBubble className="px-7 py-8">
          <p className="text-[22px] font-bold text-black leading-[36px] relative z-10">
            {summary}
          </p>
        </SpeechBubble>

        {/* スタンスと日時情報 */}
        <ReportMetaInfo
          stance={stance}
          role={role}
          roleTitle={roleTitle}
          sessionStartedAt={sessionStartedAt}
          duration={duration}
          characterCount={characterCount}
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
        footer={
          <Link
            href={getInterviewChatLogLink(reportId, from) as Route}
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

      {/* 法案の記事に戻るボタン */}
      <div className="flex flex-col gap-3">
        <BackToBillButton billId={billId} />
      </div>

      {/* パンくずリスト */}
      <ReportBreadcrumb billId={billId} />
    </div>
  );
}
