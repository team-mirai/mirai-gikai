"use client";

import { Button } from "@/components/ui/button";
import { Frown, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleReaction } from "../../server/actions/toggle-reaction";
import type { ReactionType, ReportReactionData } from "../../shared/types";
import { computeOptimisticState } from "../../shared/utils/compute-optimistic-state";

interface ReactionButtonsInlineProps {
  reportId: string;
  billId: string;
  initialData: ReportReactionData;
}

export function ReactionButtonsInline({
  reportId,
  billId,
  initialData,
}: ReactionButtonsInlineProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    initialData,
    computeOptimisticState
  );

  const handleClick = (e: React.MouseEvent, reactionType: ReactionType) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      setOptimistic(reactionType);
      const result = await toggleReaction(reportId, reactionType, billId);
      if (!result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-4">
      <InlineReactionButton
        type="helpful"
        label="参考になる"
        count={optimistic.counts.helpful}
        isActive={optimistic.userReaction === "helpful"}
        disabled={isPending}
        onClick={(e) => handleClick(e, "helpful")}
      />
      <InlineReactionButton
        type="hmm"
        label="うーん..."
        count={optimistic.counts.hmm}
        isActive={optimistic.userReaction === "hmm"}
        disabled={isPending}
        onClick={(e) => handleClick(e, "hmm")}
      />
    </div>
  );
}

interface InlineReactionButtonProps {
  type: ReactionType;
  label: string;
  count: number;
  isActive: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function InlineReactionButton({
  type,
  label,
  count,
  isActive,
  disabled,
  onClick,
}: InlineReactionButtonProps) {
  const Icon = type === "helpful" ? Lightbulb : Frown;
  const colorClass = isActive
    ? "text-mirai-reaction-active"
    : "text-mirai-reaction-inactive";

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 h-auto px-0 py-0 hover:bg-transparent"
    >
      <Icon size={16} className={`transition-colors ${colorClass}`} />
      <span className={`text-xs font-medium transition-colors ${colorClass}`}>
        {label}
      </span>
      {count > 0 && (
        <span className={`text-xs font-medium transition-colors ${colorClass}`}>
          {count}
        </span>
      )}
    </Button>
  );
}
