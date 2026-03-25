"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runSingleModerationAction } from "../../server/actions/run-single-moderation-action";

interface RegenerateModerationButtonProps {
  reportId: string;
  sessionId: string;
  billId: string;
}

export function RegenerateModerationButton({
  reportId,
  sessionId,
  billId,
}: RegenerateModerationButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await runSingleModerationAction(
        reportId,
        billId,
        sessionId
      );

      if (result.success) {
        toast.success(`モデレーション再評価完了: スコア ${result.score}`);
      } else {
        toast.error(result.error || "モデレーション再評価に失敗しました");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <RefreshCw
        className={`h-4 w-4 mr-1 ${isPending ? "animate-spin" : ""}`}
      />
      {isPending ? "再評価中..." : "再評価"}
    </Button>
  );
}
