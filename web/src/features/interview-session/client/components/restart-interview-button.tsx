"use client";

import { MessageSquare, Mic, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";
import { prewarmAudioContext } from "@/features/voice-interview/client/utils/audio-context";
import { archiveInterviewSession } from "../../server/actions/archive-interview-session";

interface RestartInterviewButtonProps {
  sessionId: string;
  billId: string;
  previewToken?: string;
  voiceEnabled?: boolean;
}

export function RestartInterviewButton({
  sessionId,
  billId,
  previewToken,
  voiceEnabled,
}: RestartInterviewButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const handleClick = async () => {
    const confirmed = window.confirm(
      "現在の回答内容は破棄されます。最初からやり直しますか？"
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await archiveInterviewSession(sessionId);
      if (result.success) {
        if (voiceEnabled) {
          // 音声対応の場合はモード選択を表示
          setShowModeSelect(true);
          setIsLoading(false);
        } else {
          const chatLink = getInterviewChatLink(billId, previewToken);
          router.push(chatLink);
        }
      } else {
        console.error("Failed to archive session:", result.error);
        alert(result.error || "やり直しに失敗しました");
      }
    } catch (error) {
      console.error("Failed to archive session:", error);
      alert("やり直しに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMode = (mode?: "voice") => {
    if (mode === "voice") {
      prewarmAudioContext();
    }
    setIsLoading(true);
    router.push(getInterviewChatLink(billId, previewToken, mode));
  };

  if (showModeSelect) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm text-muted-foreground text-center">
          回答方法を選んでください
        </p>
        <Button
          variant="outline"
          onClick={() => handleSelectMode()}
          disabled={isLoading}
          className="w-full"
        >
          <MessageSquare className="size-4" />
          <span>テキストで回答する</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSelectMode("voice")}
          disabled={isLoading}
          className="w-full"
        >
          <Mic className="size-4" />
          <span>音声で回答する</span>
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      <RotateCcw className="size-4" />
      <span>{isLoading ? "処理中..." : "もう一度最初から回答する"}</span>
    </Button>
  );
}
