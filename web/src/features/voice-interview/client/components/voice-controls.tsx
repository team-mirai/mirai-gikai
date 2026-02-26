"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceState } from "../../shared/types";

interface VoiceControlsProps {
  state: VoiceState;
  onTapMic: () => void;
}

const MIC_STYLES: Record<VoiceState, string> = {
  idle: "bg-gray-100 hover:bg-gray-200 text-gray-600",
  listening: "bg-red-100 hover:bg-red-200 text-red-600 animate-pulse",
  processing: "bg-yellow-100 text-yellow-600 cursor-not-allowed",
  speaking: "bg-blue-100 hover:bg-blue-200 text-blue-600",
  error: "bg-red-50 hover:bg-red-100 text-red-500",
};

export function VoiceControls({ state, onTapMic }: VoiceControlsProps) {
  const isProcessing = state === "processing";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-14 w-14 rounded-full ${MIC_STYLES[state]}`}
      onClick={onTapMic}
      disabled={isProcessing}
      aria-label={
        state === "listening"
          ? "マイクを停止"
          : state === "speaking"
            ? "AI の発話を停止して話す"
            : state === "error"
              ? "もう一度試す"
              : "マイクを開始"
      }
    >
      {state === "listening" ? (
        <Mic className="h-6 w-6" />
      ) : (
        <MicOff className="h-6 w-6" />
      )}
    </Button>
  );
}
