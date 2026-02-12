"use client";

import type { MouseEvent, KeyboardEvent } from "react";
import Image from "next/image";
import {
  shareNative,
  shareOnFacebook,
  shareOnLine,
  shareOnThreads,
  shareOnTwitter,
} from "@/features/bills/client/utils/share-handlers";

interface BillShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareMessage: string;
  shareUrl: string;
  thumbnailUrl?: string | null;
}

export function BillShareModal({
  isOpen,
  onClose,
  shareMessage,
  shareUrl,
  thumbnailUrl,
}: BillShareModalProps) {
  if (!isOpen) return null;

  // 共有ボタンの設定
  const shareButtons = [
    {
      name: "X (Twitter)",
      iconPath: "/icons/sns/icon_x.png",
      onClick: () => shareOnTwitter(shareMessage, shareUrl),
    },
    {
      name: "Facebook",
      iconPath: "/icons/sns/icon_facebook.png",
      onClick: () => shareOnFacebook(shareUrl),
    },
    {
      name: "LINE",
      iconPath: "/icons/sns/icon_line.png",
      onClick: () => shareOnLine(shareMessage, shareUrl),
      className: "md:hidden",
    },
    {
      name: "Threads",
      iconPath: "/icons/sns/icon_threads.png",
      onClick: () => shareOnThreads(shareMessage, shareUrl),
      className: "md:hidden",
    },
    {
      name: "共有",
      iconPath: "/icons/share-general.png",
      onClick: () => shareNative(shareMessage, shareUrl),
      className: "md:hidden",
    },
  ];

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    // 背景クリック時のみモーダルを閉じる
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBackgroundKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Escapeキーでモーダルを閉じる
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
      <div className="bg-white rounded-2xl p-7 w-[370px] max-w-full flex flex-col items-center gap-9">
        {/* タイトル */}
        <h2 className="text-xl font-bold text-gray-800 text-center w-full">
          記事を共有する
        </h2>

        {/* サムネイル画像エリア */}
        {thumbnailUrl && (
          <div className="w-full h-[180px] relative rounded-md overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt="記事のサムネイル"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* シェアセクション */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-base font-bold text-gray-800 text-center">
            シェアして国会の議論をオープンに
          </p>

          {/* SNSアイコン */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {shareButtons.map((button) => (
              <button
                key={button.name}
                type="button"
                onClick={button.onClick}
                className={`w-12 h-12 flex items-center justify-center ${
                  button.className || ""
                }`}
              >
                <Image
                  src={button.iconPath}
                  alt={button.name}
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="w-[287px] max-w-full rounded-full px-6 py-3 font-bold text-base bg-mirai-gradient text-gray-800 border border-gray-800"
        >
          このまま閉じる
        </button>
      </div>
    </div>
  );
}
