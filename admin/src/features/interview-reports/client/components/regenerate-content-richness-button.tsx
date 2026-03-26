"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runSingleContentRichnessAction } from "../../server/actions/run-single-content-richness-action";

interface RegenerateContentRichnessButtonProps {
  reportId: string;
  sessionId: string;
  billId: string;
}

export function RegenerateContentRichnessButton({
  reportId,
  sessionId,
  billId,
}: RegenerateContentRichnessButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await runSingleContentRichnessAction(
          reportId,
          billId,
          sessionId
        );

        if (result.success) {
          toast.success(`情報充実度の再評価完了: 総合スコア ${result.total}`);
        } else {
          toast.error(result.error || "情報充実度の再評価に失敗しました");
        }
      } catch {
        toast.error("情報充実度の再評価に失敗しました");
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
