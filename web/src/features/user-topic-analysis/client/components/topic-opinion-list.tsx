"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { OpinionCard } from "../../shared/components/opinion-card";
import type { PublicOpinion } from "../../shared/types";
import {
  filterOpinions,
  type TopicFilterChip,
  topicFilterOptions,
} from "../../shared/utils/filter-topics";
import { useFilteredPagination } from "../hooks/use-filtered-pagination";
import { TopicFilterChips } from "./topic-filter-chips";

/** 最初に表示する意見件数と、「もっと見る」で1回に追加する件数。 */
const INITIAL_VISIBLE = 20;
const LOAD_STEP = 20;

interface TopicOpinionListProps {
  opinions: PublicOpinion[];
  /** レポートリンクの表示判定に使う、議案の公開レポート件数。 */
  publicReportCount: number;
  /** 相対日時の基準時刻（ms）。サーバー側で固定し、ハイドレーションずれを防ぐ。 */
  nowMs: number;
}

export function TopicOpinionList({
  opinions,
  publicReportCount,
  nowMs,
}: TopicOpinionListProps) {
  const now = new Date(nowMs);
  const { filter, visible, remaining, selectFilter, loadMore } =
    useFilteredPagination(opinions, filterOpinions, INITIAL_VISIBLE, LOAD_STEP);

  // 各フィルタchipに該当意見数を表示する
  const counts = useMemo(() => {
    const result: Partial<Record<TopicFilterChip, number>> = {};
    for (const { value } of topicFilterOptions) {
      result[value] = filterOpinions(opinions, value).length;
    }
    return result;
  }, [opinions]);

  return (
    <div className="flex flex-col gap-4">
      <TopicFilterChips
        activeFilter={filter}
        onSelect={selectFilter}
        counts={counts}
      />

      <div className="flex flex-col gap-4">
        {visible.length > 0 ? (
          visible.map((opinion) => (
            <OpinionCard
              key={opinion.id}
              opinion={opinion}
              publicReportCount={publicReportCount}
              now={now}
            />
          ))
        ) : (
          <p className="py-8 text-center text-mirai-text-muted">
            該当する意見はありません
          </p>
        )}
      </div>

      {remaining > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            className="h-auto w-full gap-2.5 rounded-[100px] border-mirai-text bg-white px-6 py-3 text-[15px] font-medium text-mirai-text hover:bg-mirai-surface-gray"
          >
            あと {remaining} 件の意見を見る
            <ChevronDown className="size-[15px] shrink-0" />
          </Button>
        </div>
      )}
    </div>
  );
}
