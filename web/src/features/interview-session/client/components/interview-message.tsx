import type { UIMessage } from "@ai-sdk/react";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { useMemo } from "react";
import { SystemMessage } from "@/features/chat/client/components/system-message";
import { UserMessage } from "@/features/chat/client/components/user-message";
import { InterviewSummary } from "@/features/interview-session/client/components/interview-summary";
import { rehypeOpenLinksInNewTab } from "@/lib/markdown/rehype-open-links-in-new-tab";
import type { InterviewReportViewData } from "../../shared/schemas";

type RehypePlugins = ComponentProps<typeof SystemMessage>["rehypePlugins"];

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
  const rehypePlugins: RehypePlugins = useMemo(
    () => (openLinksInNewTab ? [rehypeOpenLinksInNewTab] : undefined),
    [openLinksInNewTab]
  );

  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex-shrink-0">
        <Image
          src="/icons/ai-chat.svg"
          alt="AI"
          width={36}
          height={36}
          className="rounded-full"
        />
      </div>
      <div className="flex-1 space-y-2">
        <SystemMessage
          message={message}
          isStreaming={isStreaming}
          rehypePlugins={rehypePlugins}
        />
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
