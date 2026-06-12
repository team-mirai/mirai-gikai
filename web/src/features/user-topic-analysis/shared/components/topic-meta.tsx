import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicTopic, UserCategory } from "../types";
import {
  userCategoryColorClass,
  userCategoryLabels,
} from "../utils/topic-category";

/**
 * カテゴリchipの表示順と件数フィールド。
 * 「一般市民(citizen)」は表示しない方針のため含めない。
 */
const CATEGORY_ORDER: { category: UserCategory; count: keyof PublicTopic }[] = [
  { category: "affected", count: "affected_count" },
  { category: "industry", count: "industry_count" },
  { category: "expert", count: "expert_count" },
];

/** 期待・懸念の件数表示（どちらも0なら何も描画しない）。 */
export function TopicSentiment({
  sentiment,
  highlight = null,
}: {
  sentiment: PublicTopic["sentiment"];
  /** フィルタ選択中の感情。一致する側を淡色背景でハイライトする。 */
  highlight?: "期待" | "懸念" | null;
}) {
  if (sentiment.期待 <= 0 && sentiment.懸念 <= 0) return null;
  return (
    <div className="flex items-center gap-3 text-[13px] font-medium">
      {sentiment.期待 > 0 && (
        <span
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-primary-accent",
            highlight === "期待" ? "bg-stance-for-bg font-bold" : "px-0 py-0"
          )}
        >
          期待<span>{sentiment.期待}</span>
        </span>
      )}
      {sentiment.懸念 > 0 && (
        <span
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-stance-against-light",
            highlight === "懸念"
              ? "bg-stance-against-bg font-bold"
              : "px-0 py-0"
          )}
        >
          懸念<span>{sentiment.懸念}</span>
        </span>
      )}
    </div>
  );
}

/** カテゴリ別の人数chip（件数0のカテゴリは描画しない）。 */
export function TopicCategoryChips({
  topic,
  highlightCategory = null,
}: {
  topic: PublicTopic;
  /** フィルタ選択中のカテゴリ。一致するchipをハイライトする。 */
  highlightCategory?: UserCategory | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORY_ORDER.map(({ category, count }) => {
        const value = topic[count] as number;
        if (value <= 0) return null;
        const isHighlighted = category === highlightCategory;
        return (
          <span
            key={category}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl px-1.5 py-1",
              isHighlighted ? "bg-mirai-gradient font-bold" : "bg-topic-chip-bg"
            )}
          >
            <UserRound
              className={cn(
                "size-[13px] shrink-0",
                userCategoryColorClass[category]
              )}
            />
            <span className="text-[13px] font-medium leading-[14px] text-mirai-text">
              {value}人の{userCategoryLabels[category]}
            </span>
          </span>
        );
      })}
    </div>
  );
}
