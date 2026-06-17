"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseTopicFilter,
  type TopicFilter,
} from "../../shared/utils/filter-topics";

/** persistKey から、フィルタ保存用の sessionStorage キーを導出する。 */
function filterStorageKey(persistKey: string): string {
  return `${persistKey}:filter`;
}

/**
 * トピック一覧・意見一覧で共通の「フィルタ + 段階表示」状態を管理するフック。
 *
 * - フィルタchipを再選択したら all に戻す（トグル解除）。
 * - フィルタ変更時は表示件数を初期値にリセットする。
 * - filterFn は安定参照のモジュール関数を渡すこと（毎レンダー生成しない）。
 * - persistKey を渡すと表示件数とフィルタを sessionStorage に保存し、別ページから
 *   戻った際に復元する（トピック詳細→一覧の「戻る」でフィルタ・ページネーション位置を
 *   維持する用途）。
 */
export function useFilteredPagination<T>(
  items: T[],
  filterFn: (items: T[], filter: TopicFilter) => T[],
  initialVisible: number,
  loadStep: number,
  persistKey?: string
) {
  const [filter, setFilter] = useState<TopicFilter>("all");
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  // 戻り遷移時にフィルタとページネーション位置を復元する。
  // ハイドレーション不整合を避けるため初期値はそのままにし、
  // マウント後の effect で sessionStorage の値を反映する。
  useEffect(() => {
    if (!persistKey) return;
    const stored = sessionStorage.getItem(persistKey);
    const n = stored ? Number.parseInt(stored, 10) : Number.NaN;
    if (Number.isFinite(n) && n > initialVisible) {
      setVisibleCount(n);
    }
    const storedFilter = sessionStorage.getItem(filterStorageKey(persistKey));
    if (storedFilter) {
      setFilter(parseTopicFilter(storedFilter));
    }
  }, [persistKey, initialVisible]);

  const persist = (n: number) => {
    if (persistKey) sessionStorage.setItem(persistKey, String(n));
  };

  const persistFilter = (next: TopicFilter) => {
    if (persistKey) {
      sessionStorage.setItem(filterStorageKey(persistKey), next);
    }
  };

  const filtered = useMemo(
    () => filterFn(items, filter),
    [items, filter, filterFn]
  );

  const selectFilter = (next: TopicFilter) => {
    // トグル解除（同じchip再選択）も考慮して、確定後のフィルタ値を保存する。
    const resolved = filter === next ? "all" : next;
    setFilter(resolved);
    setVisibleCount(initialVisible);
    persist(initialVisible);
    persistFilter(resolved);
  };

  const loadMore = () => {
    setVisibleCount((count) => {
      const next = count + loadStep;
      persist(next);
      return next;
    });
  };

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  return { filter, filtered, visible, remaining, selectFilter, loadMore };
}
