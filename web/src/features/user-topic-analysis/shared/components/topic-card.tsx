import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { PublicOpinion, PublicTopic } from "../types";
import { opinionAttributionLabel } from "../utils/topic-category";
import { TopicCategoryChips, TopicSentiment } from "./topic-meta";

function QuoteItem({ opinion }: { opinion: PublicOpinion }) {
  const attribution = opinionAttributionLabel(opinion);
  return (
    <div className="border-l border-mirai-border pl-3">
      <p className="font-mirai-serif text-[14px] font-semibold leading-[22px] text-mirai-text">
        <span className="mr-0.5 align-[-0.1em] text-[18px] text-primary-accent">
          “
        </span>
        {opinion.contextual_quote}
        <span className="ml-1 whitespace-nowrap text-[11px] text-primary-accent">
          （<span className="underline">{attribution}</span>）
        </span>
      </p>
    </div>
  );
}

interface TopicCardProps {
  topic: PublicTopic;
  href: string;
  /** 表示する代表意見の最大件数。 */
  maxQuotes?: number;
}

export function TopicCard({ topic, href, maxQuotes = 3 }: TopicCardProps) {
  const quotes = topic.opinions
    .filter((o) => o.contextual_quote?.trim())
    .slice(0, maxQuotes);

  return (
    <Link
      href={href as Route}
      prefetch={false}
      className="flex w-full flex-col gap-4 rounded-[14px] bg-white px-4 py-5 text-left transition-colors hover:bg-mirai-surface-gray"
    >
      {/* タイトル + 件数 + chevron */}
      <div className="flex items-start gap-2.5">
        <h3 className="min-w-0 flex-1 text-base font-bold leading-6 text-mirai-text">
          {topic.title}
          <span className="ml-1 text-[11px] font-medium text-topic-count">
            （{topic.opinion_count}件）
          </span>
        </h3>
        <ChevronRight className="size-[18px] shrink-0 text-primary" />
      </div>

      <div className="flex flex-col gap-2">
        <TopicSentiment sentiment={topic.sentiment} />
        <TopicCategoryChips topic={topic} />
      </div>

      {/* 代表意見の引用 */}
      {quotes.length > 0 && (
        <div className="flex flex-col gap-3">
          {quotes.map((opinion) => (
            <QuoteItem key={opinion.id} opinion={opinion} />
          ))}
        </div>
      )}
    </Link>
  );
}
