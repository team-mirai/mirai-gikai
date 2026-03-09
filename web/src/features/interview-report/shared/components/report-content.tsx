import type { ReactNode } from "react";
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
  sessionStartedAt: string | null;
  duration?: string;
  characterCount: number;
  roleDescription: string | null;
  opinions: Opinion[];
  /** 意見リストの後に差し込む追加セクション（有識者登録バナーなど） */
  children?: ReactNode;
}

export function ReportContent({
  reportId,
  billId,
  summary,
  stance,
  role,
  sessionStartedAt,
  duration,
  characterCount,
  roleDescription,
  opinions,
  children,
}: ReportContentProps) {
  return (
    <div className="flex flex-col gap-9">
      {/* 要約カード */}
      <div className="flex flex-col items-center gap-9">
        <SpeechBubble>
          <p className="text-lg font-bold text-gray-800 leading-relaxed relative z-10 text-center">
            {summary}
          </p>
        </SpeechBubble>

        {/* スタンスと日時情報 */}
        <ReportMetaInfo
          stance={stance}
          role={role}
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
        footer={
          <Link
            href={getInterviewChatLogLink(reportId)}
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
