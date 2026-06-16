"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { RespondentCard } from "../../shared/components/respondent-card";
import type { PublicRespondent } from "../../shared/types";
import {
  filterByAttributes,
  type TopicFilterChip,
  topicFilterOptions,
} from "../../shared/utils/filter-topics";
import { useFilteredPagination } from "../hooks/use-filtered-pagination";
import { TopicFilterChips } from "./topic-filter-chips";

/** 最初に表示する回答件数と、「もっと見る」で1回に追加する件数。 */
const INITIAL_VISIBLE = 20;
const LOAD_STEP = 20;

interface RespondentListProps {
  respondents: PublicRespondent[];
  /** 相対日時の基準時刻（ms）。サーバー側で固定し、ハイドレーションずれを防ぐ。 */
  nowMs: number;
}

export function RespondentList({ respondents, nowMs }: RespondentListProps) {
  const now = new Date(nowMs);
  const { filter, filtered, visible, remaining, selectFilter, loadMore } =
    useFilteredPagination(
      respondents,
      filterByAttributes,
      INITIAL_VISIBLE,
      LOAD_STEP
    );

  // 各フィルタchipに該当回答数を表示する
  const counts = useMemo(() => {
    const result: Partial<Record<TopicFilterChip, number>> = {};
    for (const { value } of topicFilterOptions) {
      result[value] = filterByAttributes(respondents, value).length;
    }
    return result;
  }, [respondents]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] font-bold text-topic-label">
        {filtered.length}人のインタビューの回答
      </p>
      <TopicFilterChips
        activeFilter={filter}
        onSelect={selectFilter}
        counts={counts}
        countSuffix="人"
      />

      <div className="flex flex-col gap-4">
        {visible.length > 0 ? (
          visible.map((respondent) => (
            <RespondentCard
              key={respondent.id}
              respondent={respondent}
              now={now}
            />
          ))
        ) : (
          <p className="py-8 text-center text-mirai-text-muted">
            該当する回答はありません
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
            あと {remaining} 人のインタビュー回答を見る
            <ChevronDown className="size-[15px] shrink-0" />
          </Button>
        </div>
      )}
    </div>
  );
}
