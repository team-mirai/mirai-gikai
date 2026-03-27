"use client";

import { ChevronDown, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  fetchModerationTargetIds,
  runModerationChunkAction,
} from "../../server/actions/run-batch-moderation-action";
import { chunkArray } from "../../shared/utils/chunk-array";

const CHUNK_SIZE = 50;

export function BatchModerationButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [includeScored, setIncludeScored] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<{
    processed: number;
    failed: number;
    total: number;
  } | null>(null);

  const handleExecute = async () => {
    if (isRunning) return;
    setOpen(false);
    setIsRunning(true);
    setProgress(null);

    try {
      const mode = includeScored ? "all" : "unscored";
      const targetResult = await fetchModerationTargetIds(mode);

      if (!targetResult.success || !targetResult.reportIds) {
        toast.error(targetResult.error || "対象レポートの取得に失敗しました");
        return;
      }

      const reportIds = targetResult.reportIds;

      if (reportIds.length === 0) {
        toast.info("対象のレポートがありません");
        return;
      }

      const chunks = chunkArray(reportIds, CHUNK_SIZE);
      let totalProcessed = 0;
      let totalFailed = 0;
      setProgress({ processed: 0, failed: 0, total: reportIds.length });

      for (const chunk of chunks) {
        const result = await runModerationChunkAction(chunk);

        if (result.success) {
          totalProcessed += result.processed ?? 0;
          totalFailed += result.failed ?? 0;
        } else {
          totalFailed += chunk.length;
        }

        setProgress({
          processed: totalProcessed,
          failed: totalFailed,
          total: reportIds.length,
        });
      }

      if (totalFailed > 0) {
        toast.warning(
          `モデレーション評価完了: ${totalProcessed}/${reportIds.length}件処理（${totalFailed}件失敗）`
        );
      } else {
        toast.success(
          `モデレーション評価完了: ${totalProcessed}/${reportIds.length}件処理`
        );
      }

      router.refresh();
    } catch (error) {
      console.error("Batch moderation failed:", error);
      toast.error("モデレーション一括評価に失敗しました");
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  if (isRunning && progress) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ShieldCheck className="h-4 w-4 mr-1" />
        {`評価中... ${progress.processed}/${progress.total}${progress.failed ? ` (${progress.failed}件失敗)` : ""}`}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={isRunning}>
          <ShieldCheck className="h-4 w-4 mr-1" />
          モデレーション一括評価
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="include-scored"
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              id="include-scored"
              checked={includeScored}
              onCheckedChange={(checked) => setIncludeScored(checked === true)}
            />
            評価済みも含める
          </label>
          <Button size="sm" onClick={handleExecute}>
            実行
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
