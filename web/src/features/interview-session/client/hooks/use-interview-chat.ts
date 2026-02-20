"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  type InterviewStage,
  interviewChatResponseSchema,
} from "@/features/interview-session/shared/schemas";
import {
  buildMessagesForApi,
  type ConversationMessage,
  convertPartialReport,
} from "../utils/message-utils";
import { useInterviewRetry } from "./use-interview-retry";
import { type InitialMessage, useParsedMessages } from "./use-parsed-messages";
import { useQuickReplies } from "./use-quick-replies";

interface UseInterviewChatProps {
  billId: string;
  initialMessages: InitialMessage[];
}

export function useInterviewChat({
  billId,
  initialMessages,
}: UseInterviewChatProps) {
  // 初期メッセージのパース
  const { parsedInitialMessages, initialStage } =
    useParsedMessages(initialMessages);

  // 基本状態
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<InterviewStage>(initialStage);
  const [conversationMessages, setConversationMessages] = useState<
    ConversationMessage[]
  >([]);

  // リトライロジック
  const retry = useInterviewRetry();

  // chat→summary遷移時の自動summaryリクエスト用
  const isTransitioningToSummary = useRef(false);

  // useObjectフックを使用（streamObjectの結果を受け取る）
  const { object, submit, isLoading, error } = useObject({
    api: "/api/interview/chat",
    schema: interviewChatResponseSchema,
    onFinish: ({ object: finishedObject, error: finishedError }) => {
      if (finishedError) {
        // リトライ処理を委譲
        const handled = retry.handleError(finishedError, submit);
        if (handled) return; // 自動リトライ実行済み
        return; // 手動リトライ待ち
      }

      // 成功時はリトライをリセット
      retry.resetRetry();

      if (finishedObject) {
        const {
          text,
          report,
          quick_replies,
          question_id,
          topic_title,
          next_stage,
        } = finishedObject;
        const questionId = question_id ?? null;
        const topicTitle = topic_title ?? null;

        // レスポンスからnext_stageを取得してステージを更新
        if (next_stage) {
          // chat→summary遷移を検知してフラグを立てる
          if (next_stage === "summary" && stage === "chat") {
            isTransitioningToSummary.current = true;
          }
          setStage(next_stage);
        }

        setConversationMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: text ?? "",
            report: convertPartialReport(report),
            quickReplies:
              questionId && Array.isArray(quick_replies) ? quick_replies : [],
            questionId,
            topicTitle,
          },
        ]);
      }
    },
  });

  // ローディング状態
  const isChatLoading = isLoading;

  // 完了時のコールバック（summary_completeへの遷移用）
  const handleComplete = (reportId: string | null) => {
    setStage("summary_complete");
    setCompletedReportId(reportId);
  };

  const [completedReportId, setCompletedReportId] = useState<string | null>(
    null
  );

  // 初期メッセージと会話履歴を統合
  const messages = [...parsedInitialMessages, ...conversationMessages];

  // クイックリプライ
  const currentQuickReplies = useQuickReplies({
    messages,
    isLoading: isChatLoading,
  });

  // objectからreportを取得
  const streamingReportData = convertPartialReport(object?.report);

  // チャットAPI送信のヘルパー（リクエストパラメータを保存）
  const submitChatMessage = (
    userMessageText: string,
    currentStage: InterviewStage,
    nextQuestionId?: string
  ) => {
    const requestParams = {
      messages: buildMessagesForApi(
        parsedInitialMessages,
        conversationMessages,
        userMessageText
      ),
      billId,
      currentStage,
      nextQuestionId,
    };
    retry.saveRequestParams(requestParams); // 失敗時の自動リトライ用に保存
    submit(requestParams);
  };

  // submitChatMessageの最新参照を保持（useEffect内から安全に呼び出すため）
  const submitChatRef = useRef(submitChatMessage);
  submitChatRef.current = submitChatMessage;

  // chat→summary遷移時に自動でsummaryリクエストを発行
  useEffect(() => {
    if (
      isTransitioningToSummary.current &&
      stage === "summary" &&
      !isChatLoading
    ) {
      isTransitioningToSummary.current = false;
      submitChatRef.current("", "summary");
    }
  }, [stage, isChatLoading]);

  // メッセージ送信
  // LLMがnext_stageを直接出力し、レスポンスのnext_stageでステージが更新される
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText || isChatLoading || stage === "summary_complete") {
      return;
    }

    const userMessageText = message.text ?? "";
    const userMessageId = `user-${Date.now()}`;

    // ユーザーメッセージを会話履歴に追加
    setConversationMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: userMessageText,
      },
    ]);
    setInput("");

    // 現在のステージでメッセージ送信
    // バックエンドでファシリテーション判定が行われ、レスポンスにnext_stageが含まれる
    submitChatMessage(userMessageText, stage);
  };

  // クイックリプライを選択した時の処理
  const handleQuickReply = (reply: string) => {
    handleSubmit({ text: reply });
  };

  // 手動リトライ関数
  const handleRetry = () => {
    if (!retry.canRetry) return;

    // 保存されたリクエストパラメータでリトライ
    retry.manualRetry(submit);
  };

  return {
    // 状態
    input,
    setInput,
    stage,
    messages,
    isLoading: isChatLoading,
    error: error || retry.displayError,
    object,
    streamingReportData,
    currentQuickReplies,
    completedReportId,
    canRetry: retry.canRetry,

    // アクション
    handleSubmit,
    handleQuickReply,
    handleComplete,
    handleRetry,
  };
}
