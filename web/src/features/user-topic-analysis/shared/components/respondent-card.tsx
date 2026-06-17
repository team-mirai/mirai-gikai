import { TrendingDown, TrendingUp } from "lucide-react";
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
import { PersonAvatar } from "./person-avatar";
import { userCategoryIcons } from "./topic-meta";

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
      className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-mirai-surface-gray"
    >
      {/* アバター */}
      <PersonAvatar sentiment={respondent.bill_sentiment} />

      {/* アバター横: ロール・バッジ・要約を同じインデントで縦並び */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-bold leading-6 text-mirai-text">
            {heading}
          </h3>
          {/* 期待懸念 + カテゴリ + 日付 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
            <span className="inline-flex items-center gap-1 rounded-xl bg-topic-chip-bg px-2 py-1 text-[13px] font-medium text-mirai-text">
              <CategoryIcon
                className={cn(
                  "size-[14px] shrink-0",
                  userCategoryColorClass[respondent.user_category]
                )}
              />
              {userCategoryLabels[respondent.user_category]}
            </span>
            {dateLabel && (
              <span className="text-[13px] text-topic-label">{dateLabel}</span>
            )}
          </div>
        </div>

        {/* 要約テキスト */}
        {respondent.summary && (
          <p className="line-clamp-2 text-[12px] leading-[22px] text-mirai-text-secondary">
            {respondent.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
