import type { UIMessage } from "@ai-sdk/react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";

interface SystemMessageProps {
  message: UIMessage;
  isStreaming: boolean;
}

export function SystemMessage({ message, isStreaming }: SystemMessageProps) {
  return (
    <Message from="assistant" className="justify-start py-0">
      <MessageContent
        variant="flat"
        className="text-sm font-medium leading-[1.8] text-[#1F2937]"
      >
        {message.parts.map((part, i: number) => {
          switch (part.type) {
            case "text":
              return (
                <Response key={`${message.id}-${i}`} className="break-words">
                  {part.text}
                </Response>
              );
            case "reasoning":
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
          return null;
        })}
      </MessageContent>
    </Message>
  );
}
