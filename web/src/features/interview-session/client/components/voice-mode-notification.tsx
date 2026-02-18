"use client";

import { useEffect } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceModeNotificationProps {
  show: boolean;
  onDismiss: () => void;
}

export function VoiceModeNotification({
  show,
  onDismiss,
}: VoiceModeNotificationProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 mb-2">
      <Info className="size-4 text-amber-600 shrink-0" />
      <span className="text-xs text-amber-700 flex-1">
        しばらく音声が検出されなかったため、音声モードを終了しました
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="size-6"
        aria-label="閉じる"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
