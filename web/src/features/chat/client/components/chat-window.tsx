"use client";

import { X } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from "react";
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
import type { Bill } from "@/features/bills/shared/types";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useViewportHeight } from "@/hooks/use-viewport-height";
import { SystemMessage } from "./system-message";
import { UserMessage } from "./user-message";

interface ChatWindowProps {
  billContext?: Bill;
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
  sessionId: string;
}

/**
 * Conversation内部で使用するコンポーネント
 * useStickToBottomContextを使用するために分離
 */
function ChatMessages({
  billContext,
  difficultyLevel,
  messages,
  sendMessage,
  status,
  pageContext,
  sessionId,
}: {
  billContext?: Bill;
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
          <p className="text-sm font-bold leading-[1.8] text-[#1F2937]">
            国会や法案について、気になることをAIに質問してください。
          </p>
          {billContext && (
            <p className="text-sm font-bold leading-[1.8] text-[#1F2937]">
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
                className="px-3 py-1 text-xs leading-[2] text-[#0F8472] border border-[#2AA693] rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  sendMessage({
                    text: question,
                    metadata: {
                      billContext,
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
  difficultyLevel,
  chatState,
  isOpen,
  onClose,
  pageContext,
  disableAutoFocus = false,
  sessionId,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { messages, sendMessage, status, error } = chatState;
  const isDesktop = useIsDesktop();
  const viewportHeight = useViewportHeight();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isResponding = status === "streaming" || status === "submitted";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // チャットが開かれたときにinputにフォーカス（disableAutoFocusがfalseの場合のみ）
  useEffect(() => {
    if (isOpen && textareaRef.current && !disableAutoFocus) {
      textareaRef.current?.focus();
    }
  }, [isOpen, disableAutoFocus]);

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
        difficultyLevel,
        pageContext,
        sessionId,
      },
    });

    // Reset form
    setInput("");
  };

  const chatContent = (
    <>
      {/* オーバーレイ（1400px未満でのみ表示） */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 transition-opacity cursor-default pc:hidden"
          onClick={onClose}
          aria-label="モーダルを閉じる"
        />
      )}

      {/* チャットウィンドウ */}
      <div
        // xlサイズでは、横幅1180px（メイン + チャット）の中央寄せにする
        className={`fixed inset-x-0 bottom-0 z-50
          bg-white shadow-md rounded-t-2xl flex flex-col
          md:bottom-4 md:right-4 md:left-auto md:w-[450px] md:rounded-2xl
					pc:visible pc:opacity-100 h-[80vh] pc:h-[70vh]
          xl:right-[calc(calc(100%-1180px)/2)]
					${isOpen ? "visible opacity-100" : "invisible opacity-0 pc:visible pc:opacity-100"}
				`}
        style={
          viewportHeight && !isDesktop
            ? { maxHeight: `${viewportHeight}px` }
            : undefined
        }
      >
        <button
          type="button"
          className="pc:hidden self-end p-2 m-2 hover:bg-gray-100 rounded-full"
          onClick={onClose}
          aria-label="モーダルを閉じる"
        >
          <X className="h-5 w-5" />
        </button>
        {/* メッセージエリア（スクロール可能） */}
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="p-0 flex flex-col gap-3 pc:pt-6 pb-2 px-6">
            <ChatMessages
              billContext={billContext}
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
            className="flex items-end gap-2.5 py-2 pl-6 pr-4 bg-white rounded-[50px] border-2 border-transparent bg-clip-padding divide-y-0"
            style={{
              backgroundImage:
                "linear-gradient(white, white), linear-gradient(-45deg, rgba(188, 236, 211, 1) 0%, rgba(100, 216, 198, 1) 100%)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
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
                className={`!min-h-0 min-w-0 wrap-anywhere text-sm font-medium leading-[1.5em] tracking-[0.01em] placeholder:text-[#AEAEB2] placeholder:font-medium placeholder:leading-[1.5em] placeholder:tracking-[0.01em] placeholder:no-underline border-none focus:ring-0 bg-transparent shadow-none !py-2 !px-0`}
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
          <PromptInputError status={status} error={error} />
          {messages.length > 0 && <PromptInputHint />}
        </div>
      </div>
    </>
  );

  // body直下にPortalでマウント（クライアントサイドのみ）
  if (!isMounted) {
    return null;
  }

  // チャットのストリーミング表示がルビ機能と競合して表示がおかしくなるため、body直下に移動してルビ機能の影響を受けないようにする
  return createPortal(chatContent, document.body);
}
