import "server-only";

import { Bot, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { getReportWithMessages } from "../loaders/get-report-with-messages";
import { countCharacters } from "../../shared/utils/report-utils";
import { parseOpinions } from "../../shared/utils/format-utils";
import { BackToBillButton } from "../../shared/components/back-to-bill-button";
import { ReportBreadcrumb } from "../../shared/components/report-breadcrumb";
import { IntervieweeInfo } from "../../shared/components/interviewee-info";
import { OpinionsList } from "../../shared/components/opinions-list";
import { ReportMetaInfo } from "../../shared/components/report-meta-info";

interface ReportChatLogPageProps {
  reportId: string;
}

export async function ReportChatLogPage({ reportId }: ReportChatLogPageProps) {
  const data = await getReportWithMessages(reportId);

  if (!data) {
    notFound();
  }

  const { report, messages, bill } = data;
  const billName = bill.bill_content?.title || bill.name;
  const characterCount = countCharacters(messages);
  const opinions = parseOpinions(report.opinions);

  return (
    <div className="min-h-dvh bg-[#F7F4F0]">
      {/* Header Section */}
      <div className="px-4 pt-24 pb-8">
        <div className="flex flex-col items-center">
          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-800">
            インタビューレポート
          </h1>

          {/* Bill Name */}
          <Link
            href={getBillDetailLink(report.bill_id)}
            className="text-sm text-black underline mt-2"
          >
            {billName}
          </Link>

          {/* Stance and Meta Info */}
          <div className="mt-8">
            <ReportMetaInfo
              stance={report.stance}
              role={report.role}
              sessionStartedAt={report.session_started_at}
              characterCount={characterCount}
              variant="chat-log"
            />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-4 py-8">
        <div className="flex flex-col gap-9">
          {/* Interviewee Info */}
          <IntervieweeInfo roleDescription={report.role_description} />

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
          <OpinionsList opinions={opinions} showBackground={false} />

          {/* Back to Bill Button */}
          <div className="flex flex-col gap-3">
            <BackToBillButton billId={report.bill_id} />
          </div>

          {/* Breadcrumb Navigation */}
          <ReportBreadcrumb
            billId={report.bill_id}
            additionalItems={[{ label: "すべての会話ログ" }]}
          />
        </div>
      </div>
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

function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    // AI message: icon on top left with gray background, then plain text below
    return (
      <div className="flex flex-col items-start gap-2">
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <Bot size={24} className="text-gray-600" />
        </div>
        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-gray-800">
          {message.content}
        </p>
      </div>
    );
  }

  // User message: icon on top right, then bubble below
  return (
    <div className="flex flex-col items-end gap-2">
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
