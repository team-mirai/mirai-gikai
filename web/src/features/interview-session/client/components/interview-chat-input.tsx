"use client";

import type { ChangeEvent } from "react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputError,
  PromptInputHint,
  type PromptInputMessage,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { useIsDesktop } from "@/hooks/use-is-desktop";

interface InterviewChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  placeholder: string;
  isResponding: boolean;
  error?: Error | null;
  showHint?: boolean;
}

export function InterviewChatInput({
  input,
  onInputChange,
  onSubmit,
  placeholder,
  isResponding,
  error,
}: InterviewChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = "";
    }
  }, [input]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <>
      <PromptInput
        onSubmit={onSubmit}
        className="flex items-end gap-2.5 py-2 pl-6 pr-4 bg-white rounded-[50px] border-mirai-gradient divide-y-0"
      >
        <PromptInputBody className="flex-1">
          <PromptInputTextarea
            ref={textareaRef}
            onChange={handleInputChange}
            value={input}
            placeholder={placeholder}
            rows={1}
            submitOnEnter={isDesktop}
            className="!min-h-0 min-w-0 wrap-anywhere text-sm font-medium leading-[1.5em] tracking-[0.01em] placeholder:text-mirai-text-placeholder placeholder:font-medium placeholder:leading-[1.5em] placeholder:tracking-[0.01em] placeholder:no-underline border-none focus:ring-0 bg-transparent shadow-none !py-2 !px-0"
          />
        </PromptInputBody>
        <button
          type="submit"
          disabled={!input || isResponding}
          className="flex-shrink-0 w-10 h-10 disabled:opacity-50"
        >
          <Image
            src="/icons/send-button-icon.svg"
            alt="送信"
            width={40}
            height={40}
            className="w-full h-full"
          />
        </button>
      </PromptInput>
      <PromptInputError status={error ? "error" : undefined} error={error} />
      {/* {showHint && <PromptInputHint />} */}
      <PromptInputHint>
        個人情報や機密情報は記載しないでください
      </PromptInputHint>
    </>
  );
}
