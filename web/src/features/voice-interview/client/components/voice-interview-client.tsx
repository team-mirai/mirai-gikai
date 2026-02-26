"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type SpeechSpeed,
  getSpeechSpeed,
  setSpeechSpeed,
} from "../utils/speech-speed-storage";
import { useInterviewCompletion } from "@/features/interview-session/client/hooks/use-interview-completion";
import { InterviewSummary } from "@/features/interview-session/client/components/interview-summary";
import { InterviewPublicConsentModal } from "@/features/interview-report/client/components/interview-public-consent-modal";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";
import { useVoiceInterview } from "../hooks/use-voice-interview";
import { VoiceControls } from "./voice-controls";
import { VoiceStatusIndicator } from "./voice-status-indicator";

const SPEED_RATE_MAP: Record<SpeechSpeed, string | undefined> = {
  slow: "-20%",
  normal: undefined,
  fast: "+30%",
};

const SPEED_LABELS: Record<SpeechSpeed, string> = {
  slow: "ゆっくり",
  normal: "ふつう",
  fast: "はやい",
};

interface VoiceInterviewClientProps {
  billId: string;
  initialMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export function VoiceInterviewClient({
  billId,
  initialMessages,
}: VoiceInterviewClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [speechSpeed, setSpeechSpeedState] = useState<SpeechSpeed>("normal");

  // SSR hydration 対策: mount後に localStorage から復元
  useEffect(() => {
    setSpeechSpeedState(getSpeechSpeed());
  }, []);

  const handleSpeedChange = (speed: SpeechSpeed) => {
    setSpeechSpeedState(speed);
    setSpeechSpeed(speed);
  };

  const speechRate = SPEED_RATE_MAP[speechSpeed];

  const {
    state,
    messages,
    currentTranscript,
    startListening,
    retry,
    errorMessage,
    isSupported,
    interviewStage,
    sessionId,
    reportData,
  } = useVoiceInterview({
    billId,
    speechRate,
    initialMessages,
  });

  const { isCompleting, completeError, handleSubmit } = useInterviewCompletion({
    sessionId: sessionId ?? "",
  });

  if (!isSupported) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            お使いのブラウザは音声認識に対応していません。Chrome または Edge
            をご利用ください。
          </p>
        </div>
        <Link
          href={getInterviewChatLink(billId)}
          className="text-blue-700 underline hover:text-blue-900"
        >
          テキストモードでインタビューに参加する
        </Link>
      </div>
    );
  }

  const speedSelector = (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">話速</span>
      <Select
        value={speechSpeed}
        onValueChange={(v) => handleSpeedChange(v as SpeechSpeed)}
      >
        <SelectTrigger size="sm" className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SPEED_LABELS) as SpeechSpeed[]).map((key) => (
            <SelectItem key={key} value={key}>
              {SPEED_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const isSummaryPhase =
    interviewStage === "summary" || interviewStage === "summary_complete";

  return (
    <div className="flex flex-col gap-4">
      {/* 話速コントロール（メッセージ上部に固定表示） */}
      {!isSummaryPhase && (
        <div className="flex justify-end">{speedSelector}</div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`rounded-lg p-3 text-sm ${
              msg.role === "user"
                ? "ml-8 bg-blue-50 text-blue-900"
                : "mr-8 bg-gray-50 text-gray-900"
            }`}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {msg.role === "user" ? "あなた" : "AI"}
            </p>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}

        {currentTranscript && (
          <div className="ml-8 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-3 text-sm text-blue-800">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              あなた（認識中）
            </p>
            <p>{currentTranscript}</p>
          </div>
        )}
      </div>

      {/* サマリーフェーズ: レポート表示 + 完了アクション（TTS再生中も表示） */}
      {isSummaryPhase && (
        <div className="flex flex-col gap-3 border-t pt-4">
          {reportData && <InterviewSummary report={reportData} />}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span>インタビューが完了しました</span>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={isCompleting || !sessionId}
          >
            {isCompleting ? "保存中..." : "レポート内容に同意して提出に進む"}
          </Button>
          {completeError && (
            <p className="text-sm text-destructive">{completeError}</p>
          )}
          <InterviewPublicConsentModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSubmit={handleSubmit}
            isSubmitting={isCompleting}
          />
        </div>
      )}

      {/* 通常フェーズ: 音声コントロール */}
      {!isSummaryPhase && (
        <div className="flex flex-col items-center gap-3 border-t pt-4">
          <VoiceStatusIndicator
            state={state}
            errorMessage={errorMessage}
            onRetry={retry}
          />
          <VoiceControls state={state} onTapMic={startListening} />
        </div>
      )}
    </div>
  );
}
