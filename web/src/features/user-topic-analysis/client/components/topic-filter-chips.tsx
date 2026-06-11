"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type TopicFilter,
  type TopicFilterChip,
  topicFilterOptions,
} from "../../shared/utils/filter-topics";

const filterIcons: Record<TopicFilterChip, LucideIcon> = {
  affected: UserRound,
  industry: UserRound,
  expert: UserRound,
  citizen: UserRound,
  期待: TrendingUp,
  懸念: TrendingDown,
};

interface TopicFilterChipsProps {
  activeFilter: TopicFilter;
  /** chipクリック時に呼ばれる。同じ値を再選択したら all 相当のトグル解除は呼び出し側で行う。 */
  onSelect: (filter: TopicFilter) => void;
}

/** トピック一覧・詳細で共通利用するフィルタchip行（横スクロール）。 */
export function TopicFilterChips({
  activeFilter,
  onSelect,
}: TopicFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {topicFilterOptions.map((option) => {
        const Icon = filterIcons[option.value];
        const isActive = activeFilter === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            onClick={() => onSelect(option.value)}
            className={cn(
              "h-auto shrink-0 gap-1 rounded-[50px] border border-mirai-text px-3 py-1.5 text-[13px] font-bold text-mirai-text hover:bg-mirai-surface-gray",
              isActive && "bg-mirai-gradient hover:opacity-90"
            )}
          >
            <Icon className="size-[15px] shrink-0" />
            <span>{option.label}</span>
            {isActive && <X className="size-[14px] shrink-0" />}
          </Button>
        );
      })}
    </div>
  );
}
