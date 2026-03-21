"use client";

import { Button } from "@/components/ui/button";
import { useAnonymousSupabaseUser } from "@/features/chat/client/hooks/use-anonymous-supabase-user";
import { Lightbulb, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toggleReaction } from "../../server/actions/toggle-reaction";
import type { ReactionType, ReportReactionData } from "../../shared/types";
import { computeOptimisticState } from "../../shared/utils/compute-optimistic-state";
import { ReportShareModal } from "./report-share-modal";

interface ReactionButtonsProps {
  reportId: string;
  initialData: ReportReactionData;
  billName: string;
  shareUrl: string;
  thumbnailUrl?: string | null;
  /** 共有ボタンを表示するかどうか（非公開レポートでは非表示） */
  showShare?: boolean;
}

export function ReactionButtons({
  reportId,
  initialData,
  billName,
  shareUrl,
  thumbnailUrl,
  showShare = true,
}: ReactionButtonsProps) {
  useAnonymousSupabaseUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [optimistic, setOptimistic] = useOptimistic(
    initialData,
    computeOptimisticState
  );

  const handleClick = (reactionType: ReactionType) => {
    startTransition(async () => {
      setOptimistic(reactionType);
      try {
        const result = await toggleReaction(reportId, reactionType);
        if (!result.success) {
          router.refresh();
        }
      } catch {
        router.refresh();
      }
    });
  };

  const isActive = optimistic.userReaction === "helpful";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
        <div className="border-t border-gray-400" />
        <div className="flex items-stretch">
          {/* 参考になる */}
          <Button
            variant="ghost"
            onClick={() => handleClick("helpful")}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 h-auto py-5 rounded-none hover:bg-transparent active:bg-gray-50"
          >
            <Lightbulb
              size={20}
              className={`transition-colors ${
                isActive
                  ? "text-mirai-reaction-active fill-mirai-reaction-active"
                  : "text-gray-800"
              }`}
            />
            <span className="text-[15px] font-bold text-gray-800">
              参考になる
            </span>
            {optimistic.counts.helpful > 0 && (
              <span className="text-[15px] font-bold text-gray-800">
                {optimistic.counts.helpful}
              </span>
            )}
          </Button>

          {showShare && (
            <>
              {/* セパレーター */}
              <div className="w-px self-center h-6 bg-gray-400 shrink-0" />

              {/* 共有する */}
              <Button
                variant="ghost"
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 h-auto py-5 rounded-none hover:bg-transparent active:bg-gray-50"
              >
                <Upload size={20} className="text-gray-800" />
                <span className="text-[15px] font-bold text-gray-800">
                  共有する
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      <ReportShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        billName={billName}
        shareUrl={shareUrl}
        thumbnailUrl={thumbnailUrl}
      />
    </>
  );
}
