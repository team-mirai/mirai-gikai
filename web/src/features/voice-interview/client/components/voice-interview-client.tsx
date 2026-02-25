"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckCircle, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInterviewCompletion } from "@/features/interview-session/client/hooks/use-interview-completion";
import { InterviewSubmitSection } from "@/features/interview-session/client/components/interview-submit-section";
import { InterviewSummary } from "@/features/interview-session/client/components/interview-summary";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";
import { useVoiceInterview } from "../hooks/use-voice-interview";
import { VoiceControls } from "./voice-controls";
import { VoiceStatusIndicator } from "./voice-status-indicator";

type SpeechSpeed = "slow" | "normal" | "fast";

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
  /** デバッグ用自動応答リスト（指定するとTTS・音声認識をスキップして自動進行） */
  autoResponses?: string[];
}

export function VoiceInterviewClient({
  billId,
  initialMessages,
  autoResponses,
}: VoiceInterviewClientProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>("normal");

  const speechRate = SPEED_RATE_MAP[speechSpeed];

  const {
    state,
    messages,
    currentTranscript,
    startListening,
    stopSpeaking,
    startInterview,
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
    autoResponses,
  });

  const { isCompleting, completeError, handleAgree } = useInterviewCompletion({
    sessionId: sessionId ?? "",
    onComplete: (id) => setReportId(id),
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
        onValueChange={(v) => setSpeechSpeed(v as SpeechSpeed)}
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

  // 開始前: タップして音声インタビューを開始するオーバーレイを表示
  if (!hasStarted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="text-center text-sm text-muted-foreground">
          <p>タップして音声インタビューを開始します</p>
        </div>
        {speedSelector}
        <Button
          size="lg"
          className="h-20 w-20 rounded-full"
          onClick={() => {
            setHasStarted(true);
            startInterview();
          }}
        >
          <Mic className="h-8 w-8" />
        </Button>
      </div>
    );
  }

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

          {reportId && sessionId ? (
            <InterviewSubmitSection sessionId={sessionId} reportId={reportId} />
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>インタビューが完了しました</span>
              </div>
              <Button
                onClick={handleAgree}
                disabled={isCompleting || !sessionId}
              >
                {isCompleting
                  ? "保存中..."
                  : "レポート内容に同意して提出に進む"}
              </Button>
              {completeError && (
                <p className="text-sm text-destructive">{completeError}</p>
              )}
            </>
          )}
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
          <VoiceControls
            state={state}
            onTapMic={startListening}
            onStopSpeaking={stopSpeaking}
          />
        </div>
      )}
    </div>
  );
}
