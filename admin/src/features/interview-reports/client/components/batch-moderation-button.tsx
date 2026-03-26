"use client";

import { ShieldCheck } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runBatchModerationAction } from "../../server/actions/run-batch-moderation-action";

export function BatchModerationButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await runBatchModerationAction();

      if (result.success) {
        if (result.total === 0) {
          toast.info("対象のレポートがありません");
        } else {
          toast.success(
            `モデレーション評価完了: ${result.processed}/${result.total}件処理${result.failed ? `（${result.failed}件失敗）` : ""}`
          );
        }
      } else {
        toast.error(result.error || "モデレーション一括評価に失敗しました");
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
      <ShieldCheck className="h-4 w-4 mr-1" />
      {isPending ? "モデレーション評価中..." : "モデレーション一括評価"}
    </Button>
  );
}
