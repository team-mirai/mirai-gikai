import "server-only";

import { Bot, ChevronLeft, UserRound } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
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
import { BackToBillButton } from "../../shared/components/back-to-bill-button";
import { BackToReportButton } from "../../shared/components/back-to-report-button";
import { IntervieweeInfo } from "../../shared/components/interviewee-info";
import { OpinionsList } from "../../shared/components/opinions-list";
import { ReportBreadcrumb } from "../../shared/components/report-breadcrumb";
import { ReportMetaInfo } from "../../shared/components/report-meta-info";
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
          {/* Chat Log Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              🎤すべての会話ログ
            </h2>
            <div className="bg-white rounded-2xl p-6">
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            </div>
          </div>

          {/* Opinions Section */}
          <OpinionsList opinions={opinions} />

          {/* Back to Report / Bill Buttons */}
          <div className="flex flex-col gap-3">
            <BackToReportButton href={reportHref} />
            <BackToBillButton billId={report.bill_id} />
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
        showReaction={false}
      />
    </div>
  );
}

interface ChatMessageProps {
  message: {
    id: string;
    role: "assistant" | "user";
    content: string;
  };
}

/**
 * メッセージのcontentからテキスト部分を抽出する。
 * AIメッセージはJSON形式（{text, quick_replies, ...}）で保存されているため、
 * textフィールドを取り出す。JSONでない場合はそのまま返す。
 */
function getMessageDisplayText(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null && "text" in parsed) {
      return parsed.text ?? content;
    }
  } catch {
    // JSONでない場合はそのままテキストとして扱う
  }
  return content;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    const displayText = getMessageDisplayText(message.content);
    // AI message: icon on top left with gray background, then plain text below
    return (
      <div
        id={`message-${message.id}`}
        className="flex flex-col items-start gap-2 scroll-mt-4"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <Bot size={24} className="text-gray-600" />
        </div>
        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-gray-800">
          {displayText}
        </p>
      </div>
    );
  }

  // User message: icon on top right, then bubble below
  return (
    <div
      id={`message-${message.id}`}
      className="flex flex-col items-end gap-2 scroll-mt-4"
    >
      <div className="w-9 h-9 rounded-full bg-mirai-light-gradient flex items-center justify-center">
        <UserRound size={20} className="text-gray-600" />
      </div>
      <div className="bg-mirai-light-gradient rounded-2xl px-4 py-3 max-w-[85%]">
        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-gray-800">
          {message.content}
        </p>
      </div>
    </div>
  );
}
