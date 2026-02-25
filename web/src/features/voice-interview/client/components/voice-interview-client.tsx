"use client";

import { AlertTriangle } from "lucide-react";
import { useVoiceInterview } from "../hooks/use-voice-interview";
import { VoiceControls } from "./voice-controls";
import { VoiceStatusIndicator } from "./voice-status-indicator";
import type { VoiceInterviewMessage } from "../../shared/types";

interface VoiceInterviewClientProps {
  interviewSessionId: string;
  systemPrompt: string;
  speechRate?: string;
  onComplete?: (messages: VoiceInterviewMessage[]) => void;
}

export function VoiceInterviewClient({
  interviewSessionId,
  systemPrompt,
  speechRate,
  onComplete,
}: VoiceInterviewClientProps) {
  const {
    state,
    messages,
    currentTranscript,
    startListening,
    stopSpeaking,
    errorMessage,
    isSupported,
  } = useVoiceInterview({
    interviewSessionId,
    systemPrompt,
    speechRate,
    onComplete,
  });

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p>
          お使いのブラウザは音声認識に対応していません。Chrome または Edge
          をご利用ください。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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

      <div className="flex flex-col items-center gap-3 border-t pt-4">
        <VoiceStatusIndicator state={state} errorMessage={errorMessage} />
        <VoiceControls
          state={state}
          onTapMic={startListening}
          onStopSpeaking={stopSpeaking}
        />
      </div>
    </div>
  );
}
