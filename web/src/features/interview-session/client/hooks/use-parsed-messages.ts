"use client";

import { useMemo } from "react";
import type { InterviewStage } from "@/features/interview-session/shared/schemas";
import {
  type ConversationMessage,
  parseMessageContent,
} from "../utils/message-utils";

/** 初期メッセージの型 */
export interface InitialMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
}

/**
 * 初期メッセージをパースして、text・report・quickRepliesに分離するフック
 */
export function useParsedMessages(initialMessages: InitialMessage[]) {
  const parsedInitialMessages = useMemo(
    (): ConversationMessage[] =>
      initialMessages.map((msg) => {
        if (msg.role === "assistant") {
          const { text, report, quickReplies, questionId, topicTitle } =
            parseMessageContent(msg.content);
          return {
            id: msg.id,
            role: msg.role,
            content: text,
            report,
            quickReplies,
            questionId,
            topicTitle,
          };
        }
        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
        };
      }),
    [initialMessages]
  );

  const lastMessage = useMemo(() => {
    return parsedInitialMessages[parsedInitialMessages.length - 1];
  }, [parsedInitialMessages]);

  // 初期ステージを決定
  const initialStage: InterviewStage = useMemo(() => {
    if (lastMessage && lastMessage.report != null) {
      return "summary";
    }
    return "chat";
  }, [lastMessage]);

  return {
    parsedInitialMessages,
    initialStage,
  };
}
