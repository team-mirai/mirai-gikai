"use client";

import { Loader2, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceState } from "../../shared/types";

const STATUS_CONFIG: Record<
  VoiceState,
  { label: string; icon: React.ReactNode; className: string }
> = {
  idle: {
    label: "マイクボタンを押して話しかけてください",
    icon: <MicOff className="h-4 w-4" />,
    className: "text-muted-foreground",
  },
  listening: {
    label: "お話しください...",
    icon: <Mic className="h-4 w-4 text-red-500" />,
    className: "text-red-600",
  },
  processing: {
    label: "考え中...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    className: "text-yellow-600",
  },
  speaking: {
    label: "AIが話しています（タップで割り込めます）",
    icon: <Volume2 className="h-4 w-4 text-blue-500" />,
    className: "text-blue-600",
  },
  error: {
    label: "エラーが発生しました",
    icon: <MicOff className="h-4 w-4 text-red-500" />,
    className: "text-red-600",
  },
};

interface VoiceStatusIndicatorProps {
  state: VoiceState;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function VoiceStatusIndicator({
  state,
  errorMessage,
  onRetry,
}: VoiceStatusIndicatorProps) {
  const config = STATUS_CONFIG[state];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex items-center gap-2 text-sm ${config.className}`}>
        {config.icon}
        <span>
          {state === "error" && errorMessage ? errorMessage : config.label}
        </span>
      </div>
      {state === "error" && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="mr-1 h-3 w-3" />
          もう一度試す
        </Button>
      )}
    </div>
  );
}
