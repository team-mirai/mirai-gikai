"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { TopicCard } from "../../shared/components/topic-card";
import type { PublicTopic } from "../../shared/types";
import {
  filterAndSortTopics,
  topicSortLabel,
} from "../../shared/utils/filter-topics";
import { useFilteredPagination } from "../hooks/use-filtered-pagination";
import { TopicFilterChips } from "./topic-filter-chips";

/** 最初に表示するトピック件数と、「もっと見る」で1回に追加する件数。 */
const INITIAL_VISIBLE = 5;
const LOAD_STEP = 10;

interface TopicListProps {
  billId: string;
  topics: PublicTopic[];
}

export function TopicList({ billId, topics }: TopicListProps) {
  const { filter, filtered, visible, remaining, selectFilter, loadMore } =
    useFilteredPagination(
      topics,
      filterAndSortTopics,
      INITIAL_VISIBLE,
      LOAD_STEP
    );
  const sortLabel = topicSortLabel(filter);

  return (
    <div className="flex flex-col gap-6">
      {/* 件数ラベル + フィルタchip */}
      <div className="flex flex-col gap-4">
        <p className="text-[13px] font-bold text-topic-label">
          {filtered.length}件のトピック
          {sortLabel && `（${sortLabel}）`}
        </p>
        <TopicFilterChips activeFilter={filter} onSelect={selectFilter} />
      </div>

      {/* トピックカード一覧 */}
      <div className="flex flex-col gap-6">
        {visible.length > 0 ? (
          visible.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              href={routes.billTopicDetail(billId, topic.id)}
            />
          ))
        ) : (
          <p className="py-8 text-center text-mirai-text-muted">
            該当するトピックはありません
          </p>
        )}
      </div>

      {/* もっと見る */}
      {remaining > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            className="h-auto w-full gap-2.5 rounded-[100px] border-mirai-text bg-white px-6 py-3 text-[15px] font-medium text-mirai-text hover:bg-mirai-surface-gray"
          >
            あと {remaining} 件のトピックスを見る
            <ChevronDown className="size-[15px] shrink-0" />
          </Button>
        </div>
      )}
    </div>
  );
}
