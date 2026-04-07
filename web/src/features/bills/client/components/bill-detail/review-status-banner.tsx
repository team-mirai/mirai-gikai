"use client";

import { useState } from "react";
import { CircleCheck, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * レビュー未完了時に記事上部に表示するバナー
 */
export function ReviewInProgressBanner() {
  return (
    <div className="flex gap-2 items-start rounded-2xl bg-mirai-surface-gray px-4 py-2">
      <Info className="size-5 shrink-0 text-mirai-text mt-0.5" />
      <p className="text-xs font-medium leading-[1.5] text-mirai-text">
        この記事は現在、複数有識者によるレビュー中です。今後内容が変更されることがあります。
      </p>
    </div>
  );
}

interface ReviewCompleteBadgeProps {
  showTooltip?: boolean;
}

/**
 * レビュー完了時にタイトル横に表示するチェックマーク
 * showTooltip=true の場合、ホバー＋タップでツールチップを表示（スマホ対応）
 */
export function ReviewCompleteBadge({
  showTooltip = false,
}: ReviewCompleteBadgeProps) {
  const [open, setOpen] = useState(false);

  const icon = (
    <span className="inline-flex items-center align-[-0.0625em]">
      <CircleCheck className="size-6 fill-primary text-white" />
    </span>
  );

  if (!showTooltip) {
    return icon;
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center align-[-0.0625em]"
          onClick={() => setOpen(true)}
        >
          <CircleCheck className="size-6 fill-primary text-white" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="bg-mirai-surface-gray text-mirai-text font-medium text-xs rounded-lg px-4 py-2"
      >
        この記事は複数有識者によるレビューが完了しています
      </TooltipContent>
    </Tooltip>
  );
}
