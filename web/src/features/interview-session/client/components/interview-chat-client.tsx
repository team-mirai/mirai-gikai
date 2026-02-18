"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { useInterviewChat } from "../hooks/use-interview-chat";
import { useVoiceMode } from "../hooks/use-voice-mode";
import { calcInterviewProgress } from "../utils/calc-interview-progress";
import { InterviewChatInput } from "./interview-chat-input";
import { InterviewErrorDisplay } from "./interview-error-display";
import { InterviewMessage } from "./interview-message";
import { InterviewProgressBar } from "./interview-progress-bar";
import { InterviewSubmitSection } from "./interview-submit-section";
import { InterviewSummaryInput } from "./interview-summary-input";
import { QuickReplyButtons } from "./quick-reply-buttons";
import { VoiceModeNotification } from "./voice-mode-notification";
import { VoiceModePanel } from "./voice-mode-panel";

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
}

export function InterviewChatClient({
  billId,
  sessionId,
  initialMessages,
  mode,
  totalQuestions,
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
    completedReportId,
    canRetry,
    latestAssistantText,
    latestAssistantTextId,
    handleSubmit,
    handleQuickReply,
    handleComplete,
    handleRetry,
  } = useInterviewChat({
    billId,
    initialMessages,
  });

  // Voice mode
  const voiceMode = useVoiceMode({
    isAiResponding: isLoading,
    onInputChange: setInput,
  });

  // Wrap handleSubmit to notify voice mode
  const handleChatSubmit = useCallback(
    (...args: Parameters<typeof handleSubmit>) => {
      if (voiceMode.isVoiceModeOn) {
        voiceMode.notifyMessageSent();
      }
      handleSubmit(...args);
    },
    [voiceMode, handleSubmit]
  );

  // Track which AI message we last spoke
  const lastSpokenTextIdRef = useRef(0);

  // Auto-read AI message when voice mode is on and AI finishes
  useEffect(() => {
    if (
      voiceMode.isVoiceModeOn &&
      latestAssistantText &&
      latestAssistantTextId > lastSpokenTextIdRef.current &&
      !isLoading
    ) {
      lastSpokenTextIdRef.current = latestAssistantTextId;
      voiceMode.speakMessage(latestAssistantText);
    }
  }, [latestAssistantText, latestAssistantTextId, isLoading, voiceMode]);

  // Auto-disable voice mode when stage changes away from "chat"
  useEffect(() => {
    if (stage !== "chat" && voiceMode.isVoiceModeOn) {
      voiceMode.disableVoiceMode();
    }
  }, [stage, voiceMode]);

  const progress = useMemo(
    () => calcInterviewProgress(totalQuestions, stage, messages),
    [messages, totalQuestions, stage]
  );

  const showProgressBar = mode === "loop" && progress !== null;

  const handleSkipTopic = () => {
    handleSubmit({ text: "次のテーマに進みたいです" });
  };

  // ストリーミング中のメッセージがすでに会話履歴に追加されているかどうか
  const isStreamingMessageCommitted =
    object &&
    messages.some((m) => m.role === "assistant" && m.content === object.text);

  // ストリーミング中のメッセージを表示するかどうか
  const showStreamingMessage = object && !isStreamingMessageCommitted;

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-96px)] pt-24 md:pt-4 bg-white">
      {showProgressBar && progress && (
        <div className="px-4 pb-1 pt-2">
          <InterviewProgressBar
            percentage={progress.percentage}
            currentTopic={progress.currentTopic}
            showSkip={progress.showSkip}
            onSkip={handleSkipTopic}
            disabled={isLoading}
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
                parts: [
                  {
                    type: "text" as const,
                    text: object.text ?? "",
                  },
                ],
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

          {/* 完了メッセージ */}
          {stage === "summary_complete" && (
            <p className="text-sm font-medium">
              インタビューにご協力いただきありがとうございました！
              <br />
              インタビュー内容を提出に進めてください。
            </p>
          )}

          {/* クイックリプライボタン */}
          {!isLoading && stage === "chat" && currentQuickReplies.length > 0 && (
            <QuickReplyButtons
              replies={currentQuickReplies}
              onSelect={(reply) => {
                if (voiceMode.isVoiceModeOn) {
                  voiceMode.disableVoiceMode();
                }
                handleQuickReply(reply);
              }}
              disabled={isLoading}
            />
          )}
        </ConversationContent>
      </Conversation>

      {/* 入力エリア */}
      <div className="px-6 pb-4 pt-2">
        {stage === "summary" && (
          <InterviewSummaryInput
            sessionId={sessionId}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onComplete={handleComplete}
            isLoading={isLoading}
            error={error}
          />
        )}

        {stage === "summary_complete" && completedReportId && (
          <InterviewSubmitSection
            sessionId={sessionId}
            reportId={completedReportId}
          />
        )}

        {stage === "chat" && (
          <>
            {/* 音声モード自動終了通知 */}
            <VoiceModeNotification
              show={voiceMode.showSilenceNotification}
              onDismiss={voiceMode.dismissSilenceNotification}
            />

            {/* 音声モードパネル */}
            {voiceMode.isVoiceModeOn && (
              <div className="mb-2">
                <VoiceModePanel
                  phase={voiceMode.phase}
                  isTtsEnabled={voiceMode.isTtsEnabled}
                  ttsAnalyserNode={voiceMode.ttsAnalyserNode}
                  micMediaStream={voiceMode.micMediaStream}
                  onClose={voiceMode.disableVoiceMode}
                  onToggleTts={voiceMode.toggleTts}
                />
              </div>
            )}

            {/* テキスト入力 */}
            <InterviewChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleChatSubmit}
              placeholder="AIに質問に回答する"
              isResponding={isLoading}
              showMicButton={!voiceMode.isVoiceModeOn && voiceMode.isSupported}
              onMicClick={voiceMode.toggleVoiceMode}
            />
          </>
        )}
      </div>
    </div>
  );
}
