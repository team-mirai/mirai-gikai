"use client";

import { useMemo } from "react";
import type { ConversationMessage } from "../utils/message-utils";

interface UseQuickRepliesProps {
  messages: ConversationMessage[];
  isLoading: boolean;
}

/**
 * 最新のAIメッセージからクイックリプライを取得するフック
 */
export function useQuickReplies({ messages, isLoading }: UseQuickRepliesProps) {
  const currentQuickReplies = useMemo(() => {
    // ストリーミング中は表示しない
    if (isLoading) return [];

    // 最新のメッセージがユーザーからの場合は表示しない（クイックリプライ選択直後）
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") return [];

    // 最新のAIメッセージからquickRepliesを取得
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (
      lastAssistantMessage?.questionId &&
      lastAssistantMessage.quickReplies &&
      lastAssistantMessage.quickReplies.length > 0
    ) {
      return lastAssistantMessage.quickReplies;
    }

    return [];
  }, [messages, isLoading]);

  return currentQuickReplies;
}
