import { isPublicReportVisible } from "@mirai-gikai/shared/report-publication/auto-publish";
import {
  ChevronRight,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { getInterviewMessageLink } from "@/features/interview-config/shared/utils/interview-links";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { PublicOpinion } from "../types";
import { formatOpinionDate } from "../utils/format-opinion-date";
import {
  userCategoryColorClass,
  userCategoryLabels,
} from "../utils/topic-category";
import { PersonAvatar } from "./person-avatar";

function SentimentLabel({
  sentiment,
}: {
  sentiment: PublicOpinion["bill_sentiment"];
}) {
  if (!sentiment) return null;
  const Icon = sentiment === "期待" ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[13px] font-medium",
        sentiment === "期待"
          ? "text-primary-accent"
          : "text-stance-against-light"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {sentiment}
    </span>
  );
}

/**
 * カテゴリのグレーchip。
 * 既定では一般市民(citizen)は非表示だが、includeCitizen 指定時は「一般」も表示する。
 */
function CategoryChip({
  opinion,
  includeCitizen = false,
}: {
  opinion: PublicOpinion;
  includeCitizen?: boolean;
}) {
  if (opinion.user_category === "citizen" && !includeCitizen) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-xl bg-topic-chip-bg px-1.5 py-1 text-[13px] font-medium text-mirai-text">
      <UserRound
        className={cn(
          "size-[13px] shrink-0",
          userCategoryColorClass[opinion.user_category]
        )}
      />
      {userCategoryLabels[opinion.user_category]}
    </span>
  );
}

function Quote({ quote }: { quote: string }) {
  return (
    <div className="ml-2 border-l-2 border-mirai-border pl-4">
      <p className="font-mirai-serif text-[14px] font-medium leading-[22px] text-mirai-text">
        <span className="mr-1 align-[-0.1em] text-[18px] text-primary-accent">
          “
        </span>
        {quote}
      </p>
    </div>
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

/** トピック詳細の意見カード（意見タイトル上・役割chip・下部に日時＋レポートリンク）。 */
export function OpinionCard({
  opinion,
  publicReportCount,
  now,
}: OpinionCardProps) {
  const dateLabel = formatOpinionDate(opinion.created_at, now);
  const quote = opinion.contextual_quote?.trim();

  const reportVisible = isPublicReportVisible({
    isPublicByAdmin: opinion.report_public,
    isPublicByUser: true,
    publicReportCount,
  });
  // レポートリンクは該当メッセージ位置へ飛ばす。
  // source_message_id が無い場合はレポート先頭にフォールバックする。
  const reportHref = opinion.source_message_id
    ? getInterviewMessageLink(
        opinion.interview_report_id,
        opinion.source_message_id,
        undefined,
        opinion.contextual_quote
      )
    : routes.publicReport(opinion.interview_report_id);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      {/* アバター + 意見タイトル */}
      <div className="flex items-center gap-2.5">
        <PersonAvatar sentiment={opinion.bill_sentiment} />
        <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-6 text-mirai-text">
          {opinion.title}
        </h3>
      </div>

      {/* stance・カテゴリ・立場 */}
      {/* カテゴリは4区分すべて表示。詳細な肩書(role_title)は一般市民以外でのみ表示する。 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <SentimentLabel sentiment={opinion.bill_sentiment} />
        <CategoryChip opinion={opinion} includeCitizen />
        {opinion.user_category !== "citizen" && opinion.role_title && (
          <span className="inline-flex items-center rounded bg-topic-chip-bg px-2 py-1 text-[13px] font-medium text-mirai-text-secondary">
            {opinion.role_title}
          </span>
        )}
        {dateLabel && (
          <span className="text-[12px] leading-[14px] text-topic-label">
            {dateLabel}
          </span>
        )}
      </div>

      {/* 引用 */}
      {quote && <Quote quote={quote} />}

      {/* レポートリンク */}
      {reportVisible && (
        <div className="flex items-center justify-end pt-3">
          <Link
            href={reportHref as Route}
            prefetch={false}
            className="flex items-center gap-0.5 text-[13px] font-bold text-primary-accent hover:underline"
          >
            インタビューレポートを読む
            <ChevronRight className="size-[14px] shrink-0" />
          </Link>
        </div>
      )}
    </div>
  );
}
