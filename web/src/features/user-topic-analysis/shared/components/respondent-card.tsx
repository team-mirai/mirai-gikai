import {
  ChevronRight,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { PublicRespondent } from "../types";
import { formatOpinionDate } from "../utils/format-opinion-date";
import {
  userCategoryColorClass,
  userCategoryLabels,
} from "../utils/topic-category";
import { userCategoryIcons } from "./topic-meta";

/** stance(期待/懸念) に応じたアバター背景色。 */
const avatarBgClass: Record<
  NonNullable<PublicRespondent["bill_sentiment"]> | "none",
  string
> = {
  期待: "bg-stance-for-bg",
  懸念: "bg-stance-against-bg",
  none: "bg-mirai-surface-warm",
};

interface RespondentCardProps {
  respondent: PublicRespondent;
  /** 相対日時の基準時刻。サーバーで固定しハイドレーションずれを防ぐ。 */
  now: Date;
}

/**
 * 回答一覧の回答者カード（回答者1人=1カード）。
 * アバター・ロール・期待懸念/カテゴリ・回答日・要約テキストを表示し、
 * カード全体がレポート詳細（会話ログ）へのリンクになる。
 */
export function RespondentCard({ respondent, now }: RespondentCardProps) {
  const dateLabel = formatOpinionDate(respondent.created_at, now);
  const heading =
    respondent.role_title?.trim() ||
    userCategoryLabels[respondent.user_category];
  const CategoryIcon = userCategoryIcons[respondent.user_category];

  return (
    <Link
      href={routes.publicReport(respondent.id) as Route}
      prefetch={false}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-mirai-surface-gray"
    >
      {/* アバター + ロール */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            avatarBgClass[respondent.bill_sentiment ?? "none"]
          )}
        >
          <UserRound
            className={cn(
              "size-5",
              userCategoryColorClass[respondent.user_category]
            )}
          />
        </span>
        <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-6 text-mirai-text">
          {heading}
        </h3>
        <ChevronRight className="size-5 shrink-0 text-primary" />
      </div>

      {/* 期待懸念 + カテゴリ + 日付 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {respondent.bill_sentiment && (
          <span
            className={cn(
              "flex items-center gap-1 text-[13px] font-medium",
              respondent.bill_sentiment === "期待"
                ? "text-primary-accent"
                : "text-stance-against-light"
            )}
          >
            {respondent.bill_sentiment === "期待" ? (
              <TrendingUp className="size-4 shrink-0" />
            ) : (
              <TrendingDown className="size-4 shrink-0" />
            )}
            {respondent.bill_sentiment}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-xl bg-topic-chip-bg px-1.5 py-1 text-[13px] font-medium text-mirai-text">
          <CategoryIcon
            className={cn(
              "size-[14px] shrink-0",
              userCategoryColorClass[respondent.user_category]
            )}
          />
          {userCategoryLabels[respondent.user_category]}
        </span>
        {dateLabel && (
          <span className="text-[11px] text-topic-label">{dateLabel}</span>
        )}
      </div>

      {/* 要約テキスト */}
      {respondent.summary && (
        <p className="line-clamp-3 text-[13px] leading-5 text-mirai-text-secondary">
          {respondent.summary}
        </p>
      )}
    </Link>
  );
}
