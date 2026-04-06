"use client";

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
        この記事は複数有識者によるレビューが完了していません。今後内容が変更されることがあります。
      </p>
    </div>
  );
}

/**
 * レビュー完了時にタイトル横に表示するチェックマーク（ツールチップ付き）
 */
export function ReviewCompleteBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center align-baseline">
          <CircleCheck className="size-5 fill-primary text-white" />
        </span>
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
