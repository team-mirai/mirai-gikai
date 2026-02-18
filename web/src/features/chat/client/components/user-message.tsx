import type { UIMessage } from "@ai-sdk/react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";

interface UserMessageProps {
  message: UIMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <Message from="user" className="justify-end py-0">
      <MessageContent
        variant="flat"
        className="max-w-fit text-sm font-medium leading-[2] text-[#000000] bg-mirai-gradient rounded-2xl px-4 !py-2"
      >
        {message.parts.map((part, i: number) => {
          if (part.type === "text") {
            return (
              <Response key={`${message.id}-${i}`} className="break-words">
                {part.text}
              </Response>
            );
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );
}
