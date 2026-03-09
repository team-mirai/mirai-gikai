"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";
import { archiveInterviewSession } from "../../server/actions/archive-interview-session";

interface RestartInterviewButtonProps {
  sessionId: string;
  billId: string;
  previewToken?: string;
}

export function RestartInterviewButton({
  sessionId,
  billId,
  previewToken,
}: RestartInterviewButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const confirmed = window.confirm(
      "現在の回答内容は破棄されます。最初からやり直しますか？"
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await archiveInterviewSession(sessionId);
      if (result.success) {
        // アーカイブ成功後、チャットページに遷移（新しいセッションが作成される）
        // 遷移完了までローディングを維持するため、成功時は setIsLoading(false) を呼ばない
        const chatLink = getInterviewChatLink(billId, previewToken);
        router.push(chatLink);
      } else {
        console.error("Failed to archive session:", result.error);
        alert(result.error || "やり直しに失敗しました");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to archive session:", error);
      alert("やり直しに失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      <RotateCcw className="size-4" />
      <span>{isLoading ? "処理中..." : "もう一度最初から回答する"}</span>
    </Button>
  );
}
