import type { UIMessage } from "@ai-sdk/react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { SystemMessage } from "@/features/chat/client/components/system-message";
import { UserMessage } from "@/features/chat/client/components/user-message";
import { InterviewSummary } from "@/features/interview-session/client/components/interview-summary";
import type { InterviewReportViewData } from "../../shared/schemas";

interface InterviewMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  report?: InterviewReportViewData | null;
  footer?: ReactNode;
  openLinksInNewTab?: boolean;
}

export function InterviewMessage({
  message,
  isStreaming = false,
  report,
  footer,
  openLinksInNewTab = false,
}: InterviewMessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: DOM内のリンクにtarget属性を付与するためmessage変更時に再実行が必要
  useEffect(() => {
    if (!openLinksInNewTab || !contentRef.current) return;
    const links = contentRef.current.querySelectorAll("a[href]");
    for (const link of links) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  }, [openLinksInNewTab, message]);

  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-shrink-0">
        <Image
          src="/icons/ai-chat.svg"
          alt="AI"
          width={36}
          height={36}
          className="rounded-full"
        />
      </div>
      <div ref={contentRef} className="flex-1 space-y-2">
        <SystemMessage message={message} isStreaming={isStreaming} />
        {report && (
          <div className="mt-2">
            <InterviewSummary report={report} />
            <p className="text-sm font-medium mt-2">
              こちらの内容で問題ありませんか？違和感がある箇所があれば指摘してください。
            </p>
          </div>
        )}
      </div>
      {footer && <div className="flex justify-end">{footer}</div>}
    </div>
  );
}
