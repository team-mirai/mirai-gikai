"use client";

import { useMemo, useState } from "react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { useInterviewChat } from "../hooks/use-interview-chat";
import { useInterviewTimer } from "../hooks/use-interview-timer";
import { calcInterviewProgress } from "../utils/calc-interview-progress";
import { InterviewChatInput } from "./interview-chat-input";
import { InterviewErrorDisplay } from "./interview-error-display";
import { InterviewMessage } from "./interview-message";
import { InterviewProgressBar } from "./interview-progress-bar";
import { InterviewSummaryInput } from "./interview-summary-input";
import { QuickReplyButtons } from "./quick-reply-buttons";
import { TimeUpPrompt } from "./time-up-prompt";

interface InterviewChatClientProps {
  billId: string;
  sessionId: string;
  initialMessages: Array<{
    id: string;
    role: "assistant" | "user";
    content: string;
    created_at: string;
  }>;
  mode?: "loop" | "bulk";
  totalQuestions?: number;
  estimatedDuration?: number | null;
  sessionStartedAt?: string;
}

export function InterviewChatClient({
  billId,
  sessionId,
  initialMessages,
  mode,
  totalQuestions,
  estimatedDuration,
  sessionStartedAt,
}: InterviewChatClientProps) {
  const {
    input,
    setInput,
    stage,
    messages,
    isLoading,
    error,
    object,
    streamingReportData,
    currentQuickReplies,
    streamingQuickReplies,
    canRetry,
    handleSubmit,
    handleQuickReply,
    handleRetry,
  } = useInterviewChat({
    billId,
    initialMessages,
  });

  const { remainingMinutes, isTimeUp } = useInterviewTimer({
    estimatedDuration,
    sessionStartedAt,
  });

  const [timeUpDismissed, setTimeUpDismissed] = useState(false);

  const progress = useMemo(
    () => calcInterviewProgress(totalQuestions, stage, messages),
    [messages, totalQuestions, stage]
  );

  const showProgressBar = mode === "loop" && progress !== null;
  const timerMinutes =
    remainingMinutes !== null && stage === "chat" && !timeUpDismissed
      ? remainingMinutes
      : null;
  const showTimeUpPrompt =
    isTimeUp && !timeUpDismissed && stage === "chat" && !isLoading;

  const handleSkipTopic = () => {
    handleSubmit({ text: "次のテーマに進みたいです" });
  };

  const handleEndInterview = () => {
    setTimeUpDismissed(true);
    handleSubmit({
      text: "目安時間になりました。レポート作成に進みたいです。",
    });
  };

  const handleContinueInterview = () => {
    setTimeUpDismissed(true);
  };

  // ストリーミング中のメッセージがすでに会話履歴に追加されているかどうか
  const isStreamingMessageCommitted =
    object &&
    messages.some((m) => m.role === "assistant" && m.content === object.text);

  // ストリーミング中のメッセージを表示するかどうか
  const showStreamingMessage = object && !isStreamingMessageCommitted;

  return (
    <div className="flex flex-col h-dvh md:h-[calc(100dvh-96px)] pt-24 md:pt-4 bg-white">
      {showProgressBar && progress && (
        <div className="px-4 pb-1 pt-2">
          <InterviewProgressBar
            percentage={progress.percentage}
            currentTopic={progress.currentTopic}
            showSkip={progress.showSkip}
            onSkip={handleSkipTopic}
            disabled={isLoading}
            remainingMinutes={timerMinutes}
          />
        </div>
      )}
      <Conversation className="flex-1 overflow-y-auto">
        <ConversationContent className="flex flex-col gap-4">
          {/* 初期表示メッセージ */}
          {messages.length === 0 && !object && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold leading-[1.8] text-[#1F2937]">
                法案についてのAIインタビューを開始します。
              </p>
              <p className="text-sm text-gray-600">
                あなたの意見や経験をお聞かせください。
              </p>
            </div>
          )}

          {/* メッセージ一覧を表示 */}
          {messages.map((message) => (
            <InterviewMessage
              key={message.id}
              message={{
                id: message.id,
                role: message.role,
                parts: [{ type: "text" as const, text: message.content }],
              }}
              isStreaming={false}
              report={message.report}
            />
          ))}

          {/* ストリーミング中のAIレスポンスを表示 */}
          {showStreamingMessage && (
            <InterviewMessage
              key="streaming-assistant"
              message={{
                id: "streaming-assistant",
                role: "assistant",
                parts: [{ type: "text" as const, text: object.text ?? "" }],
              }}
              isStreaming={isLoading}
              report={streamingReportData}
            />
          )}

          {/* ローディング表示 */}
          {isLoading && !object && (
            <span className="text-sm text-gray-500">考え中...</span>
          )}

          {/* エラー表示 */}
          <InterviewErrorDisplay
            error={error}
            canRetry={canRetry}
            onRetry={handleRetry}
            isRetrying={isLoading}
          />

          {/* クイックリプライボタン */}
          {stage === "chat" && (
            <>
              {!isLoading && currentQuickReplies.length > 0 && (
                <QuickReplyButtons
                  replies={currentQuickReplies}
                  onSelect={handleQuickReply}
                />
              )}
              {isLoading && streamingQuickReplies.length > 0 && (
                <QuickReplyButtons
                  replies={streamingQuickReplies}
                  onSelect={handleQuickReply}
                  disabled
                />
              )}
            </>
          )}
        </ConversationContent>
      </Conversation>

      {/* 時間超過プロンプト */}
      {showTimeUpPrompt && (
        <TimeUpPrompt
          onEndInterview={handleEndInterview}
          onContinue={handleContinueInterview}
          disabled={isLoading}
        />
      )}

      {/* 入力エリア */}
      <div className="px-6 pb-4 pt-2">
        {(stage === "summary" || stage === "summary_complete") && (
          <InterviewSummaryInput
            sessionId={sessionId}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}

        {stage === "chat" && (
          <InterviewChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            placeholder="AIに質問に回答する"
            isResponding={isLoading}
          />
        )}
      </div>
    </div>
  );
}
