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
import { OgpPreviewCard } from "./ogp-preview-card";

interface ReportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  billName: string;
  shareUrl: string;
  /** OGP画像のURL */
  ogImageUrl: string;
  /** シェア時のメッセージ（レポートのsummary等） */
  shareMessage?: string | null;
}

export function ReportShareModal({
  isOpen,
  onClose,
  billName,
  shareUrl,
  ogImageUrl,
  shareMessage: shareMessageProp,
}: ReportShareModalProps) {
  if (!isOpen) return null;

  const shareMessage = shareMessageProp
    ? `みらい議会AIインタビュー「${shareMessageProp}」`
    : `みらい議会AIインタビュー「${billName}」`;

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
      <div className="flex w-[500px] max-w-full flex-col items-center gap-6 rounded-2xl bg-white px-3 py-9">
        <div className="flex w-full flex-col items-center gap-6">
          {/* タイトル */}
          <h2 className="text-2xl font-bold text-gray-800">意見をシェアする</h2>

          {/* OGPプレビュー画像 */}
          <OgpPreviewCard ogImageUrl={ogImageUrl} billName={billName} />

          {/* シェアセクション */}
          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-center text-base font-bold text-gray-800">
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
                  className="flex h-12 w-12 items-center justify-center p-0"
                >
                  <Image
                    src={button.iconPath}
                    alt={button.name}
                    width={48}
                    height={48}
                    className="h-12 w-12"
                  />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 閉じるボタン */}
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-base font-bold text-primary-accent hover:bg-transparent"
        >
          閉じる
        </Button>
      </div>
    </div>
  );
}
