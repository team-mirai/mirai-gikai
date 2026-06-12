import { isPublicReportVisible } from "@mirai-gikai/shared/report-publication/auto-publish";
import { ChevronRight, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { PublicOpinion } from "../types";
import { formatOpinionDate } from "../utils/format-opinion-date";
import {
  userCategoryColorClass,
  userCategoryLabels,
} from "../utils/topic-category";

/** stance に応じたアバター背景色。 */
const avatarBgClass: Record<
  NonNullable<PublicOpinion["bill_sentiment"]> | "none",
  string
> = {
  期待: "bg-stance-for-bg",
  懸念: "bg-stance-against-bg",
  none: "bg-mirai-surface-warm",
};

function SentimentLabel({
  sentiment,
}: {
  sentiment: PublicOpinion["bill_sentiment"];
}) {
  if (!sentiment) return null;
  return (
    <span
      className={cn(
        "text-[13px] font-medium",
        sentiment === "期待"
          ? "text-primary-accent"
          : "text-stance-against-light"
      )}
    >
      {sentiment}
    </span>
  );
}

interface OpinionCardProps {
  opinion: PublicOpinion;
  /**
   * 議案の公開レポート件数。レポート詳細ページの表示条件
   * （管理者公開 × 公開件数しきい値）を満たすかの判定に使う。
   */
  publicReportCount: number;
  /**
   * 相対日時の基準時刻。サーバー側で固定値を渡し、
   * ハイドレーション時の再計算によるラベルずれを防ぐ。
   */
  now: Date;
}

export function OpinionCard({
  opinion,
  publicReportCount,
  now,
}: OpinionCardProps) {
  const bgClass = avatarBgClass[opinion.bill_sentiment ?? "none"];
  const dateLabel = formatOpinionDate(opinion.created_at, now);
  // レポート詳細が実際に表示可能なときだけリンクを出す（404 回避）。
  const reportVisible = isPublicReportVisible({
    isPublicByAdmin: opinion.report_public,
    isPublicByUser: true,
    publicReportCount,
  });

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      {/* アバター + 意見タイトル */}
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            bgClass
          )}
        >
          <UserRound
            className={cn(
              "size-5",
              userCategoryColorClass[opinion.user_category]
            )}
          />
        </span>
        <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-6 text-mirai-text">
          {opinion.title}
        </h3>
      </div>

      {/* stance・カテゴリ・立場 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <SentimentLabel sentiment={opinion.bill_sentiment} />
        {opinion.user_category !== "citizen" && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-topic-chip-bg px-1.5 py-1 text-[13px] font-medium text-mirai-text">
            <UserRound
              className={cn(
                "size-[13px] shrink-0",
                userCategoryColorClass[opinion.user_category]
              )}
            />
            {userCategoryLabels[opinion.user_category]}
          </span>
        )}
        {opinion.role_title && (
          <span className="text-[13px] text-topic-label">
            {opinion.role_title}
          </span>
        )}
      </div>

      {/* 引用 */}
      {opinion.contextual_quote?.trim() && (
        <div className="border-l border-mirai-border pl-3">
          <p className="font-mirai-serif text-[14px] font-medium leading-[22px] text-mirai-text">
            <span className="mr-0.5 align-[-0.1em] text-[18px] text-primary-accent">
              “
            </span>
            {opinion.contextual_quote}
          </p>
        </div>
      )}

      {/* 日時 + レポートリンク */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-topic-label">{dateLabel}</span>
        {reportVisible && (
          <Link
            href={routes.publicReport(opinion.interview_report_id) as Route}
            prefetch={false}
            className="flex items-center gap-0.5 text-[13px] font-medium text-primary-accent hover:underline"
          >
            インタビューレポートを読む
            <ChevronRight className="size-[14px] shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
