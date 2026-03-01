import type { UIMessage } from "@ai-sdk/react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { InterviewSuggestionBanner } from "./interview-suggestion-banner";

interface SystemMessageProps {
  message: UIMessage;
  isStreaming: boolean;
  billId?: string;
  billName?: string;
}

const SUGGEST_INTERVIEW_TOOL_TYPE = "tool-suggest_interview";

export function SystemMessage({
  message,
  isStreaming,
  billId,
  billName,
}: SystemMessageProps) {
  return (
    <Message from="assistant" className="justify-start py-0">
      <MessageContent
        variant="flat"
        className="text-sm font-medium leading-[1.8] text-mirai-text"
      >
        {message.parts.map((part, i: number) => {
          if (part.type === "text") {
            return (
              <Response key={`${message.id}-${i}`} className="break-words">
                {part.text}
              </Response>
            );
          }
          if (part.type === "reasoning") {
            return (
              <Reasoning
                key={`${message.id}-${i}`}
                className="w-full"
                isStreaming={isStreaming && i === message.parts.length - 1}
              >
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }
          if (part.type === SUGGEST_INTERVIEW_TOOL_TYPE && billId && billName) {
            return (
              <InterviewSuggestionBanner
                key={`${message.id}-${i}`}
                billId={billId}
                billName={billName}
              />
            );
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );
}
