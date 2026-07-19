"use client";

import Image from "next/image";
import type { ChangeEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStickToBottomContext } from "use-stick-to-bottom";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputError,
  PromptInputHint,
  type PromptInputMessage,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import type { BillWithContent } from "@/features/bills/shared/types";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useViewportHeight } from "@/hooks/use-viewport-height";
import {
  CHAT_PANEL_RESPONSIVE_CLASSES,
  MobileChatDialog,
} from "./mobile-chat-dialog";
import { SystemMessage } from "./system-message";
import { UserMessage } from "./user-message";

interface ChatWindowProps {
  billContext?: BillWithContent;
  hasInterviewConfig?: boolean;
  difficultyLevel: string;
  chatState: ReturnType<typeof import("@ai-sdk/react").useChat>;
  isOpen: boolean;
  onClose: () => void;
  pageContext?: {
    type: "home" | "bill";
    bills?: Array<{
      name: string;
      summary?: string;
      tags?: string[];
      isFeatured?: boolean;
    }>;
  };
  disableAutoFocus?: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  sessionId: string;
}

/**
 * Conversation内部で使用するコンポーネント
 * useStickToBottomContextを使用するために分離
 */
function ChatMessages({
  billContext,
  hasInterviewConfig,
  difficultyLevel,
  messages,
  sendMessage,
  status,
  pageContext,
  sessionId,
}: {
  billContext?: BillWithContent;
  hasInterviewConfig?: boolean;
  difficultyLevel: string;
  messages: ChatWindowProps["chatState"]["messages"];
  sendMessage: ChatWindowProps["chatState"]["sendMessage"];
  status: ChatWindowProps["chatState"]["status"];
  pageContext?: ChatWindowProps["pageContext"];
  sessionId: string;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  const userMessageLength = messages.filter((x) => x.role === "user").length;
  const isResponding = status === "streaming" || status === "submitted";

  // メッセージが追加されたら自動的にスクロール
  useEffect(() => {
    if (userMessageLength > 0) {
      scrollToBottom();
    }
  }, [userMessageLength, scrollToBottom]);

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* 初期メッセージ */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold leading-[1.8] text-mirai-text">
            国会や法案について、気になることをAIに質問してください。
          </p>
          {billContext && (
            <p className="text-sm font-bold leading-[1.8] text-mirai-text">
              本文中のテキストを選択すると簡単にAIに質問できます
            </p>
          )}
        </div>

        {/* サンプル質問チップ */}
        <div className="flex flex-wrap gap-3">
          {(billContext
            ? [`この法案のポイントは？`, "この法案は私にどんな影響がある？"]
            : [
                "みらい議会って何？",
                "国会って何をするところ？",
                "注目の法案について教えて",
              ]
          ).map((question) => {
            return (
              <button
                key={question}
                type="button"
                disabled={isResponding}
                className="px-3 py-1 text-xs leading-[2] text-primary-accent border border-primary rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  sendMessage({
                    text: question,
                    metadata: {
                      billContext,
                      hasInterviewConfig,
                      difficultyLevel,
                      pageContext,
                      sessionId,
                    },
                  });
                }}
              >
                {question}
              </button>
            );
          })}
        </div>
      </div>
      {messages.map((message) => {
        const isStreaming =
          status === "streaming" && message.id === messages.at(-1)?.id;

        return message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <SystemMessage
            key={message.id}
            message={message}
            isStreaming={isStreaming}
            billId={billContext?.id}
            billName={billContext?.bill_content?.title ?? billContext?.name}
          />
        );
      })}
      {status === "submitted" && (
        <span className="text-sm text-gray-500">考え中...</span>
      )}
    </>
  );
}

export function ChatWindow({
  billContext,
  hasInterviewConfig,
  difficultyLevel,
  chatState,
  isOpen,
  onClose,
  pageContext,
  disableAutoFocus = false,
  returnFocusRef,
  sessionId,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { messages, sendMessage, status, error } = chatState;
  const isDesktop = useIsDesktop();
  const isPc = useMediaQuery("(min-width: 1000px)");
  const viewportHeight = useViewportHeight();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isResponding = status === "streaming" || status === "submitted";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-resize textarea based on content
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);

    if (!hasText || isResponding) {
      return;
    }

    // Send message with context and difficulty level in metadata
    // By default, this sends a HTTP POST request to the /api/chat endpoint.
    sendMessage({
      text: message.text ?? "",
      metadata: {
        billContext,
        hasInterviewConfig,
        difficultyLevel,
        pageContext,
        sessionId,
      },
    });

    // Reset form
    setInput("");
  };

  const chatPanelContent = (
    <>
      {/* メッセージエリア（スクロール可能） */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="p-0 flex flex-col gap-3 pc:pt-6 pb-2 px-6">
          <ChatMessages
            billContext={billContext}
            hasInterviewConfig={hasInterviewConfig}
            difficultyLevel={difficultyLevel}
            messages={messages}
            sendMessage={sendMessage}
            status={status}
            pageContext={pageContext}
            sessionId={sessionId}
          />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* 入力エリア（固定下部） */}
      <div className="px-6 pb-4 pt-2">
        <PromptInput
          onSubmit={handleSubmit}
          className="flex items-end gap-2.5 py-2 pl-6 pr-4 bg-white rounded-[50px] border-mirai-gradient divide-y-0"
        >
          <PromptInputBody className="flex-1">
            <PromptInputTextarea
              ref={textareaRef}
              onChange={handleInputChange}
              value={input}
              placeholder="わからないことをAIに質問する"
              rows={1}
              submitOnEnter={isDesktop}
              // min-w-0, wrap-anywhere が無いと長文で親幅を押し広げてしまう
              className={`!min-h-0 min-w-0 wrap-anywhere text-sm font-medium leading-[1.5em] tracking-[0.01em] placeholder:text-mirai-text-placeholder placeholder:font-medium placeholder:leading-[1.5em] placeholder:tracking-[0.01em] placeholder:no-underline border-none focus:ring-0 bg-transparent shadow-none !py-2 !px-0`}
            />
          </PromptInputBody>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
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
          </Button>
        </PromptInput>
        <PromptInputError status={status} error={error} />
        {messages.length > 0 && <PromptInputHint />}
      </div>
    </>
  );

  // body直下にPortalでマウント（クライアントサイドのみ）
  if (!isMounted) {
    return null;
  }

  // PCでは常設の補助領域、モバイルでは背景を操作不能にするモーダルとして扱う
  if (isPc) {
    return createPortal(
      <section
        aria-label="国会や法案についてAIに質問する"
        className={`fixed inset-x-0 bottom-0 z-50 bg-white shadow-md rounded-t-2xl flex flex-col pc:h-[70vh] xl:right-[calc(calc(100%-1180px)/2)] ${CHAT_PANEL_RESPONSIVE_CLASSES}`}
      >
        {chatPanelContent}
      </section>,
      document.body
    );
  }

  return (
    <MobileChatDialog
      disableAutoFocus={disableAutoFocus}
      initialFocusRef={textareaRef}
      isOpen={isOpen}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      style={
        viewportHeight && !isDesktop
          ? { maxHeight: `${viewportHeight}px` }
          : undefined
      }
    >
      {chatPanelContent}
    </MobileChatDialog>
  );
}
