"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Figmaデザイン準拠のレビュー完了チェックアイコン */
function ReviewCheckIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="レビュー完了"
      className={className}
      style={style}
    >
      <circle cx="8" cy="8" r="8" className="fill-primary" />
      <path
        d="M5 8L7 10L11 6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * レビュー未完了時に記事上部に表示するバナー
 */
export function ReviewInProgressBanner() {
  return (
    <div className="flex gap-2 items-center rounded-2xl bg-mirai-surface-gray px-4 py-2">
      <Info className="size-5 shrink-0 text-mirai-text" />
      <p className="text-[13px] font-medium leading-[1.5] text-mirai-text">
        この記事は現在、複数有識者によるレビュー中です。今後内容が変更されることがあります。
      </p>
    </div>
  );
}

interface ReviewCompleteBadgeProps {
  showTooltip?: boolean;
  /** Icon size in px (e.g. 16). Default: size-5 (no tooltip) / size-5 (tooltip) */
  size?: number;
  /** CSS top offset (e.g. "2px"). Default: top-[1px] */
  top?: string;
}

/**
 * レビュー完了時にタイトル横に表示するチェックマーク
 * showTooltip=true の場合、ホバー＋タップでツールチップを表示（スマホ対応）
 */
export function ReviewCompleteBadge({
  showTooltip = false,
  size,
  top,
}: ReviewCompleteBadgeProps) {
  const [open, setOpen] = useState(false);

  const hasCustomSize = size != null;
  const hasCustomTop = top != null;

  const icon = (
    <span
      className={`inline-flex items-center relative ${hasCustomTop ? "" : "top-[1px]"} ml-0.5`}
      style={hasCustomTop ? { top } : undefined}
    >
      <ReviewCheckIcon
        className={hasCustomSize ? undefined : "size-5"}
        style={
          hasCustomSize
            ? { width: `${size}px`, height: `${size}px` }
            : undefined
        }
      />
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
          className={`inline-flex items-center relative ${hasCustomTop ? "" : "top-[1px]"} ml-0.5`}
          style={hasCustomTop ? { top } : undefined}
          onClick={() => setOpen(true)}
        >
          <ReviewCheckIcon
            className={hasCustomSize ? undefined : "size-5"}
            style={
              hasCustomSize
                ? { width: `${size}px`, height: `${size}px` }
                : undefined
            }
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="bg-mirai-surface-gray text-mirai-text font-medium text-xs rounded-lg px-4 py-2"
      >
        この記事は複数有識者によるレビューが
        <br />
        完了しています
      </TooltipContent>
    </Tooltip>
  );
}
