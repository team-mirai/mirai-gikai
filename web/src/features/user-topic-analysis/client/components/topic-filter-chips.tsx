"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type IconComponent,
  userCategoryIcons,
} from "../../shared/components/topic-meta";
import {
  type TopicFilter,
  type TopicFilterChip,
  topicFilterOptions,
} from "../../shared/utils/filter-topics";

const filterIcons: Record<TopicFilterChip, IconComponent> = {
  affected: userCategoryIcons.affected,
  industry: userCategoryIcons.industry,
  expert: userCategoryIcons.expert,
  citizen: userCategoryIcons.citizen,
  期待: TrendingUp,
  懸念: TrendingDown,
};

/** chipアイコンのカテゴリ別カラー（選択時は白抜きにするため未適用）。 */
const filterIconColor: Record<TopicFilterChip, string> = {
  affected: "text-topic-affected",
  industry: "text-topic-industry",
  expert: "text-topic-expert",
  citizen: "text-topic-citizen",
  期待: "text-primary-accent",
  懸念: "text-stance-against-light",
};

interface TopicFilterChipsProps {
  activeFilter: TopicFilter;
  /** chipクリック時に呼ばれる。同じ値の再選択（解除）は呼び出し側で扱う。 */
  onSelect: (filter: TopicFilter) => void;
  /** 各フィルタの件数。指定時はラベル横に表示する（トピック詳細の意見数など）。 */
  counts?: Partial<Record<TopicFilterChip, number>>;
  /** 件数の単位（回答一覧では "人"）。counts と併用する。 */
  countSuffix?: string;
}

/** トピック一覧・詳細で共通利用するフィルタchip行（横スクロール）。 */
export function TopicFilterChips({
  activeFilter,
  onSelect,
  counts,
  countSuffix = "",
}: TopicFilterChipsProps) {
  const allActive = activeFilter === "all";
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {/* 「すべて」: フィルタ解除（all）。アイコン・件数・解除Xは持たない。 */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSelect("all")}
        className={cn(
          "h-auto shrink-0 rounded-[50px] border border-mirai-text px-3 py-1.5 text-[13px] font-bold text-mirai-text",
          // フォーカス時にプライマリ（緑）の枠線/リングが出るのを抑止する
          "focus-visible:border-mirai-text! focus-visible:ring-0 focus-visible:ring-offset-0",
          allActive
            ? "bg-mirai-gradient hover:opacity-90"
            : "bg-white hover:bg-mirai-surface-gray"
        )}
      >
        すべて
      </Button>
      {topicFilterOptions.map((option) => {
        const Icon = filterIcons[option.value];
        const isActive = activeFilter === option.value;
        const count = counts?.[option.value];
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            onClick={() => onSelect(option.value)}
            className={cn(
              "h-auto shrink-0 gap-1 rounded-[50px] border border-mirai-text px-3 py-1.5 text-[13px] font-bold text-mirai-text",
              // フォーカス時にプライマリ（緑）の枠線/リングが出るのを抑止する
              "focus-visible:border-mirai-text! focus-visible:ring-0 focus-visible:ring-offset-0",
              isActive
                ? "bg-mirai-gradient hover:opacity-90"
                : "bg-white hover:bg-mirai-surface-gray"
            )}
          >
            <Icon
              className={cn(
                "size-[15px] shrink-0",
                // 選択時はグラデーション上で白抜きにするため濃色アイコンに
                isActive ? "text-mirai-text" : filterIconColor[option.value]
              )}
            />
            <span>{option.label}</span>
            {count !== undefined && (
              <span className="font-bold">
                {count}
                {countSuffix}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
