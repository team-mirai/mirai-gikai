"use client";

import { ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportInterviewTsvAction } from "../../server/actions/export-interview-tsv-action";

interface CopyTsvButtonProps {
  billId: string;
  configId: string;
}

export function CopyTsvButton({ billId, configId }: CopyTsvButtonProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleClick = async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      const result = await exportInterviewTsvAction({ billId, configId });
      if (!result.success || result.tsv === undefined) {
        toast.error(result.error || "TSVの出力に失敗しました");
        return;
      }

      await navigator.clipboard.writeText(result.tsv);
      toast.success(
        `${result.sessionCount ?? 0}件のセッションをTSVとしてコピーしました`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `クリップボードへのコピーに失敗しました: ${error.message}`
          : "クリップボードへのコピーに失敗しました"
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isRunning}
      className="gap-2"
    >
      <ClipboardCopy className="h-4 w-4" />
      {isRunning ? "コピー中..." : "全対話をTSVでコピー"}
    </Button>
  );
}
