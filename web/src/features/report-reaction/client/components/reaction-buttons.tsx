"use client";

import { Button } from "@/components/ui/button";
import { useAnonymousSupabaseUser } from "@/features/chat/client/hooks/use-anonymous-supabase-user";
import { Frown, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleReaction } from "../../server/actions/toggle-reaction";
import type { ReactionType, ReportReactionData } from "../../shared/types";
import { computeOptimisticState } from "../../shared/utils/compute-optimistic-state";

interface ReactionButtonsProps {
  reportId: string;
  initialData: ReportReactionData;
  billId?: string;
}

export function ReactionButtons({
  reportId,
  initialData,
  billId,
}: ReactionButtonsProps) {
  useAnonymousSupabaseUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    initialData,
    computeOptimisticState
  );

  const handleClick = (reactionType: ReactionType) => {
    startTransition(async () => {
      setOptimistic(reactionType);
      try {
        const result = await toggleReaction(reportId, reactionType, billId);
        if (!result.success) {
          // 失敗時はサーバーデータで再描画して不整合を解消
          router.refresh();
        }
      } catch {
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex justify-center pb-6 pt-10 bg-gradient-to-t from-mirai-surface from-40% to-transparent pointer-events-auto">
        <div className="flex items-center gap-6">
          <ReactionButton
            type="helpful"
            label="参考になる"
            count={optimistic.counts.helpful}
            isActive={optimistic.userReaction === "helpful"}
            disabled={isPending}
            onClick={() => handleClick("helpful")}
          />
          <ReactionButton
            type="hmm"
            label="うーん..."
            count={optimistic.counts.hmm}
            isActive={optimistic.userReaction === "hmm"}
            disabled={isPending}
            onClick={() => handleClick("hmm")}
          />
        </div>
      </div>
    </div>
  );
}

interface ReactionButtonProps {
  type: ReactionType;
  label: string;
  count: number;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}

function ReactionButton({
  type,
  label,
  count,
  isActive,
  disabled,
  onClick,
}: ReactionButtonProps) {
  const Icon = type === "helpful" ? Lightbulb : Frown;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 h-auto px-0 py-0 hover:bg-transparent"
    >
      <div
        className={`w-14 h-14 rounded-full bg-white flex items-center justify-center border-2 transition-colors ${
          isActive
            ? "border-mirai-reaction-active"
            : "border-mirai-reaction-inactive"
        }`}
      >
        <Icon
          size={24}
          className={`transition-colors ${
            isActive
              ? "text-mirai-reaction-active"
              : "text-mirai-reaction-inactive"
          }`}
        />
      </div>
      <span className="text-[15px] font-medium text-mirai-text">{label}</span>
      {count > 0 && (
        <span className="text-[15px] font-medium text-black">{count}</span>
      )}
    </Button>
  );
}
