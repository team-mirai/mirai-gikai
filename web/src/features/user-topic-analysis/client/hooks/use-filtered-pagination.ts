"use client";

import { useMemo, useState } from "react";
import type { TopicFilter } from "../../shared/utils/filter-topics";

/**
 * トピック一覧・意見一覧で共通の「フィルタ + 段階表示」状態を管理するフック。
 *
 * - フィルタchipを再選択したら all に戻す（トグル解除）。
 * - フィルタ変更時は表示件数を初期値にリセットする。
 * - filterFn は安定参照のモジュール関数を渡すこと（毎レンダー生成しない）。
 */
export function useFilteredPagination<T>(
  items: T[],
  filterFn: (items: T[], filter: TopicFilter) => T[],
  initialVisible: number,
  loadStep: number
) {
  const [filter, setFilter] = useState<TopicFilter>("all");
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  const filtered = useMemo(
    () => filterFn(items, filter),
    [items, filter, filterFn]
  );

  const selectFilter = (next: TopicFilter) => {
    setFilter((prev) => (prev === next ? "all" : next));
    setVisibleCount(initialVisible);
  };

  const loadMore = () => setVisibleCount((count) => count + loadStep);

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  return { filter, filtered, visible, remaining, selectFilter, loadMore };
}
