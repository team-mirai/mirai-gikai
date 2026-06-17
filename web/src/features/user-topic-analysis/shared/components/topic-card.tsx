import { isPublicReportVisible } from "@mirai-gikai/shared/report-publication/auto-publish";
import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { getInterviewMessageLink } from "@/features/interview-config/shared/utils/interview-links";
import { ClampedQuote } from "../../client/components/clamped-quote";
import type { PublicOpinion, PublicTopic } from "../types";
import { filterOpinions, type TopicFilter } from "../utils/filter-topics";
import { opinionAttributionLabel } from "../utils/topic-category";
import { TopicCategoryChips, TopicSentiment } from "./topic-meta";

/** 引用1件。messageHref があれば該当メッセージへのリンクにする。 */
function QuoteItem({
  opinion,
  messageHref,
}: {
  opinion: PublicOpinion;
  messageHref: string | null;
}) {
  // 肩書を含めて最大4行に収め、省略時は末尾に「…（肩書）」を表示する。
  const body = (
    <ClampedQuote
      quote={opinion.contextual_quote ?? ""}
      attribution={opinionAttributionLabel(opinion)}
    />
  );

  return (
    <div className="ml-2 border-l-2 border-mirai-border pl-4">
      {messageHref ? (
        <Link
          href={messageHref as Route}
          prefetch={false}
          className="pointer-events-auto block"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

interface TopicCardProps {
  topic: PublicTopic;
  href: string;
  /** 表示する代表意見の最大件数。 */
  maxQuotes?: number;
  /**
   * 一覧でフィルタが選択されている場合、その条件に該当する意見の引用を優先表示する。
   * 該当する引用が無ければ全体から表示する。
   */
  filter?: TopicFilter;
  /** 議案の公開レポート件数。引用→該当メッセージのリンク表示可否の判定に使う。 */
  publicReportCount?: number;
}

export function TopicCard({
  topic,
  href,
  maxQuotes = 3,
  filter = "all",
  publicReportCount = 0,
}: TopicCardProps) {
  const withQuote = (opinions: PublicOpinion[]) =>
    opinions.filter((o) => o.contextual_quote?.trim());
  // フィルタ該当意見の引用を優先し、無ければ全体から拾う
  const matched = withQuote(filterOpinions(topic.opinions, filter));
  const quotes = (
    matched.length > 0 ? matched : withQuote(topic.opinions)
  ).slice(0, maxQuotes);

  // フィルタ選択中の次元をカード側でもハイライトする
  const highlightCategory =
    filter === "affected" || filter === "industry" || filter === "expert"
      ? filter
      : null;
  const highlightSentiment =
    filter === "期待" || filter === "懸念" ? filter : null;

  // レポート詳細が表示可能な意見のみ、該当メッセージへのリンクにする
  const messageHrefFor = (opinion: PublicOpinion): string | null => {
    if (!opinion.source_message_id) return null;
    const visible = isPublicReportVisible({
      isPublicByAdmin: opinion.report_public,
      isPublicByUser: true,
      publicReportCount,
    });
    if (!visible) return null;
    return getInterviewMessageLink(
      opinion.interview_report_id,
      opinion.source_message_id,
      undefined,
      opinion.contextual_quote
    );
  };

  return (
    <div className="relative flex w-full flex-col gap-3 rounded-[14px] bg-white px-4 py-5 text-left transition-colors hover:bg-mirai-surface-gray">
      {/* カード全体クリックでトピック詳細へ（引用リンクと入れ子にならないようオーバーレイ） */}
      <Link
        href={href as Route}
        prefetch={false}
        aria-label={topic.title}
        className="absolute inset-0 z-0 rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      {/* タイトル〜期待懸念〜カテゴリ（クリックはオーバーレイに通す） */}
      <div className="pointer-events-none relative z-10 flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <h3 className="min-w-0 flex-1 text-base font-bold leading-6 text-mirai-text">
            {topic.title}
            <span className="ml-1 text-[11px] font-medium text-topic-count">
              （{topic.opinion_count}件）
            </span>
          </h3>
          {/* タイトル1行目(line-height 24px)と高さを揃えて > を中央寄せにする */}
          <span className="flex h-6 shrink-0 items-center">
            <ChevronRight className="size-[18px] text-primary" />
          </span>
        </div>
        <TopicSentiment
          sentiment={topic.sentiment}
          highlight={highlightSentiment}
        />
        <TopicCategoryChips
          topic={topic}
          highlightCategory={highlightCategory}
        />
      </div>

      {/* 代表意見の引用（クリックで該当メッセージへ） */}
      {quotes.length > 0 && (
        <div className="pointer-events-none relative z-10 flex flex-col gap-3">
          {quotes.map((opinion) => (
            <QuoteItem
              key={opinion.id}
              opinion={opinion}
              messageHref={messageHrefFor(opinion)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
