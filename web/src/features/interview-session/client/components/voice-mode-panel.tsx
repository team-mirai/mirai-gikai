"use client";

import { Mic, Send, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceModePhase } from "../hooks/use-voice-mode";
import { WaveformVisualizer } from "./waveform-visualizer";

interface VoiceModePanelProps {
  phase: VoiceModePhase;
  interimTranscript: string;
  isTtsEnabled: boolean;
  countdownSeconds: number;
  ttsAnalyserNode: AnalyserNode | null;
  micMediaStream: MediaStream | null;
  onClose: () => void;
  onToggleTts: () => void;
  onSendNow: () => void;
  onTranscriptEdit: (text: string) => void;
}

function PhaseLabel({ phase }: { phase: VoiceModePhase }) {
  switch (phase) {
    case "speaking":
      return (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <Volume2 className="size-4 animate-pulse" />
          <span>読み上げ中...</span>
        </div>
      );
    case "listening":
      return (
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Mic className="size-4 animate-pulse" />
          <span>聞いています...</span>
        </div>
      );
    case "countdown":
      return null;
    case "processing":
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="animate-pulse">考え中...</span>
        </div>
      );
    default:
      return null;
  }
}

export function VoiceModePanel({
  phase,
  interimTranscript,
  isTtsEnabled,
  countdownSeconds,
  ttsAnalyserNode,
  micMediaStream,
  onClose,
  onToggleTts,
  onSendNow,
  onTranscriptEdit,
}: VoiceModePanelProps) {
  const phaseColor =
    phase === "speaking"
      ? "border-emerald-200 bg-emerald-50"
      : phase === "listening"
        ? "border-blue-200 bg-blue-50"
        : phase === "countdown"
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-gray-50";

  return (
    <div className={`rounded-2xl border p-4 ${phaseColor}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        {phase === "countdown" ? (
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <span>送信まで {countdownSeconds}秒...</span>
          </div>
        ) : (
          <PhaseLabel phase={phase} />
        )}

        <div className="flex items-center gap-1">
          {phase !== "processing" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTts}
              className="size-8"
              aria-label={isTtsEnabled ? "読み上げをオフ" : "読み上げをオン"}
            >
              {isTtsEnabled ? (
                <Volume2 className="size-4" />
              ) : (
                <VolumeX className="size-4" />
              )}
            </Button>
          )}

          {phase === "countdown" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSendNow}
              className="size-8"
              aria-label="即送信"
            >
              <Send className="size-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8"
            aria-label="音声モードを終了"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Waveform */}
      {phase === "speaking" && ttsAnalyserNode && (
        <WaveformVisualizer
          analyserNode={ttsAnalyserNode}
          color="#10b981"
          height={48}
        />
      )}

      {phase === "listening" && micMediaStream && (
        <WaveformVisualizer
          mediaStream={micMediaStream}
          color="#3b82f6"
          height={48}
        />
      )}

      {phase === "processing" && (
        <div className="flex items-center justify-center h-12">
          <div className="flex gap-1.5">
            <div className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
            <div className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <div className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* Transcript display */}
      {(phase === "listening" || phase === "countdown") &&
        interimTranscript && (
          <div className="mt-2">
            {phase === "countdown" ? (
              <textarea
                value={interimTranscript}
                onChange={(e) => onTranscriptEdit(e.target.value)}
                className="w-full text-sm text-gray-800 bg-white/60 rounded-lg p-2 border border-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-amber-300"
                rows={2}
              />
            ) : (
              <p className="text-sm text-gray-500 italic px-1">
                {interimTranscript}
              </p>
            )}
          </div>
        )}
    </div>
  );
}
