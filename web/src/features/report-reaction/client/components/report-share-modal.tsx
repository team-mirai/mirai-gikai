"use client";

import type { MouseEvent, KeyboardEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  shareNative,
  shareOnFacebook,
  shareOnLine,
  shareOnTwitter,
} from "@/features/bills/client/utils/share-handlers";

interface ReportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  billName: string;
  shareUrl: string;
  thumbnailUrl?: string | null;
  /** シェア時のメッセージ（レポートのsummary等） */
  shareMessage?: string | null;
}

export function ReportShareModal({
  isOpen,
  onClose,
  billName,
  shareUrl,
  thumbnailUrl,
  shareMessage: shareMessageProp,
}: ReportShareModalProps) {
  if (!isOpen) return null;

  const shareMessage =
    shareMessageProp || `${billName}に対する意見をチェック！`;

  const shareButtons = [
    {
      name: "X (Twitter)",
      iconPath: "/icons/sns/icon_x.png",
      onClick: () => shareOnTwitter(shareMessage, shareUrl),
    },
    {
      name: "LINE",
      iconPath: "/icons/sns/icon_line.png",
      onClick: () => shareOnLine(shareMessage, shareUrl),
    },
    {
      name: "Facebook",
      iconPath: "/icons/sns/icon_facebook.png",
      onClick: () => shareOnFacebook(shareUrl),
    },
    {
      name: "共有",
      iconPath: "/icons/share-general.png",
      onClick: () => shareNative(shareMessage, shareUrl),
    },
  ];

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBackgroundKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-3"
      onClick={handleBackgroundClick}
      onKeyDown={handleBackgroundKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-2xl px-3 py-9 w-[370px] max-w-full flex flex-col items-center gap-6">
        {/* タイトルと法案名 */}
        <div className="flex flex-col items-center gap-3 text-center w-full">
          <h2 className="text-2xl font-bold text-gray-800">意見をシェアする</h2>
          <p className="text-[15px] font-medium text-gray-800 leading-7">
            {billName}
          </p>
        </div>

        {/* サムネイル画像 */}
        {thumbnailUrl && (
          <div className="w-full h-[181px] relative rounded-md overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={billName}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* シェアセクション */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-base font-bold text-gray-800 text-center">
            法案に対する意見をシェアしよう
          </p>

          {/* SNSアイコン */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {shareButtons.map((button) => (
              <Button
                key={button.name}
                type="button"
                variant="ghost"
                onClick={button.onClick}
                className="w-12 h-12 flex items-center justify-center p-0"
              >
                <Image
                  src={button.iconPath}
                  alt={button.name}
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </Button>
            ))}
          </div>
        </div>

        {/* 閉じるボタン */}
        <Button
          variant="outline"
          onClick={onClose}
          className="w-[287px] max-w-full rounded-full px-6 py-3 font-bold text-base bg-mirai-gradient text-gray-800 border border-gray-800 h-auto"
        >
          このまま閉じる
        </Button>
      </div>
    </div>
  );
}
