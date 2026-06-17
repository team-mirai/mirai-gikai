"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { TopicCard } from "../../shared/components/topic-card";
import type { PublicTopic } from "../../shared/types";
import {
  filterAndSortTopics,
  type TopicFilterChip,
  topicFilterOptions,
  topicSortLabel,
} from "../../shared/utils/filter-topics";
import { useFilteredPagination } from "../hooks/use-filtered-pagination";
import { TopicFilterChips } from "./topic-filter-chips";

/** 最初に表示するトピック件数と、「もっと見る」で1回に追加する件数。 */
const INITIAL_VISIBLE = 20;
const LOAD_STEP = 40;

interface TopicListProps {
  billId: string;
  topics: PublicTopic[];
  /** 引用→該当メッセージのリンク表示可否の判定に使う、議案の公開レポート件数。 */
  publicReportCount: number;
}

export function TopicList({
  billId,
  topics,
  publicReportCount,
}: TopicListProps) {
  const { filter, filtered, visible, remaining, selectFilter, loadMore } =
    useFilteredPagination(
      topics,
      filterAndSortTopics,
      INITIAL_VISIBLE,
      LOAD_STEP,
      `topic-list-pagination:${billId}`
    );
  const sortLabel = topicSortLabel(filter);
  // 「意見のまとめ」件数は表示中トピックの意見数の合計。
  const opinionCount = filtered.reduce((sum, t) => sum + t.opinion_count, 0);

  // 各フィルタに該当するトピック数。0件のフィルタchipは非表示にする（件数自体は表示しない）。
  const filterCounts = useMemo(() => {
    const result: Partial<Record<TopicFilterChip, number>> = {};
    for (const { value } of topicFilterOptions) {
      result[value] = filterAndSortTopics(topics, value).length;
    }
    return result;
  }, [topics]);

  return (
    <div className="flex flex-col gap-6">
      {/* 件数ラベル + フィルタchip */}
      <div className="flex flex-col gap-4">
        <p className="text-[13px] font-bold text-topic-label">
          {filtered.length}件のトピック（{opinionCount}件の意見まとめ）
          {sortLabel && `｜${sortLabel}`}
        </p>
        <TopicFilterChips
          activeFilter={filter}
          onSelect={selectFilter}
          counts={filterCounts}
          showCount={false}
        />
      </div>

      {/* トピックカード一覧 */}
      <div className="flex flex-col gap-6">
        {visible.length > 0 ? (
          visible.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              href={routes.billTopicDetail(billId, topic.id, filter)}
              filter={filter}
              publicReportCount={publicReportCount}
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
            あと {remaining} 件のトピックを見る
            <ChevronDown className="size-[15px] shrink-0" />
          </Button>
        </div>
      )}
    </div>
  );
}
