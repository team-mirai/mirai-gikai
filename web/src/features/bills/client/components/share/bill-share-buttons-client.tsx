"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { BillShareModal } from "./bill-share-modal";

interface BillShareButtonsClientProps {
  shareMessage: string;
  shareUrl: string;
  thumbnailUrl?: string | null;
}

export function BillShareButtonsClient({
  shareMessage,
  shareUrl,
  thumbnailUrl,
}: BillShareButtonsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShare = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleReport = () => {
    window.open(EXTERNAL_LINKS.REPORT, "_blank");
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button
          variant="default"
          onClick={handleShare}
          className="rounded-full px-6 py-3 h-auto font-bold text-base bg-mirai-gradient text-gray-800 hover:opacity-90 border border-gray-800"
        >
          <Image
            src="/icons/ios-share.svg"
            alt="共有アイコン"
            width={28}
            height={28}
            className="shrink-0"
          />
          記事を共有する
        </Button>
        <Button
          variant="outline"
          onClick={handleReport}
          className="rounded-full px-6 py-3 h-auto font-bold text-base bg-white text-gray-800 hover:bg-gray-50 border-gray-800"
        >
          <Image
            src="/icons/report-error.svg"
            alt="報告アイコン"
            width={26}
            height={26}
            className="shrink-0"
          />
          問題を報告する
        </Button>
      </div>

      {/* 共有モーダル */}
      <BillShareModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        shareMessage={shareMessage}
        shareUrl={shareUrl}
        thumbnailUrl={thumbnailUrl}
      />
    </>
  );
}
