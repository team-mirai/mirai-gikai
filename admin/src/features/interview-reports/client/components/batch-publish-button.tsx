"use client";

import { ChevronDown, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  bulkPublishReportsAction,
  countBulkPublishTargetsAction,
} from "../../server/actions/bulk-publish-reports-action";

interface BatchPublishButtonProps {
  billId: string;
}

export function BatchPublishButton({ billId }: BatchPublishButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [maxModerationScore, setMaxModerationScore] = useState(29);
  const [minContentRichness, setMinContentRichness] = useState(50);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);

  const handleCount = async () => {
    setIsCounting(true);
    try {
      const result = await countBulkPublishTargetsAction({
        billId,
        maxModerationScore,
        minContentRichness,
      });
      if (result.success) {
        setTargetCount(result.count ?? 0);
      } else {
        toast.error(result.error || "対象件数の取得に失敗しました");
      }
    } catch {
      toast.error("対象件数の取得に失敗しました");
    } finally {
      setIsCounting(false);
    }
  };

  const handleExecute = async () => {
    if (isRunning) return;
    setOpen(false);
    setIsRunning(true);

    try {
      const result = await bulkPublishReportsAction({
        billId,
        maxModerationScore,
        minContentRichness,
      });

      if (result.success) {
        if (result.updatedCount === 0) {
          toast.info("条件に一致する未公開レポートがありません");
        } else {
          toast.success(`${result.updatedCount}件のレポートを公開しました`);
        }
        router.refresh();
      } else {
        toast.error(result.error || "一括公開に失敗しました");
      }
    } catch {
      toast.error("一括公開に失敗しました");
    } finally {
      setIsRunning(false);
      setTargetCount(null);
    }
  };

  // 閾値変更時にカウントをリセット
  const handleModerationScoreChange = (value: string) => {
    setMaxModerationScore(Number(value) || 0);
    setTargetCount(null);
  };

  const handleContentRichnessChange = (value: string) => {
    setMinContentRichness(Number(value) || 0);
    setTargetCount(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={isRunning}>
          <Eye className="h-4 w-4 mr-1" />
          {isRunning ? "公開処理中..." : "レポート一括公開"}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max-moderation-score">
              モデレーションスコア上限
            </Label>
            <Input
              id="max-moderation-score"
              type="number"
              min={0}
              max={100}
              value={maxModerationScore}
              onChange={(e) => handleModerationScoreChange(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              この値以下のスコアを公開対象にします
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="min-content-richness">充実度スコア下限</Label>
            <Input
              id="min-content-richness"
              type="number"
              min={0}
              max={100}
              value={minContentRichness}
              onChange={(e) => handleContentRichnessChange(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              この値以上の充実度を公開対象にします
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCount}
              disabled={isCounting}
            >
              {isCounting ? "確認中..." : "対象件数を確認"}
            </Button>

            {targetCount !== null && (
              <p className="text-sm text-center font-medium">
                対象: {targetCount}件
              </p>
            )}

            <Button
              size="sm"
              onClick={handleExecute}
              disabled={targetCount === null || targetCount === 0}
            >
              公開する
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
