"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportShareModal } from "@/features/report-reaction/client/components/report-share-modal";

interface ShareArticleButtonProps {
  billName: string;
  shareUrl: string;
  ogImageUrl: string;
  shareMessage?: string | null;
}

export function ShareArticleButton({
  billName,
  shareUrl,
  ogImageUrl,
  shareMessage,
}: ShareArticleButtonProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsShareModalOpen(true)}
        className="rounded-full px-6 py-3 h-auto font-bold text-base text-white bg-gradient-to-r from-mirai-gradient-start to-mirai-gradient-end hover:opacity-90"
      >
        <Upload className="w-5 h-5" />
        記事を共有する
      </Button>
      <ReportShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        billName={billName}
        shareUrl={shareUrl}
        ogImageUrl={ogImageUrl}
        shareMessage={shareMessage}
      />
    </>
  );
}
