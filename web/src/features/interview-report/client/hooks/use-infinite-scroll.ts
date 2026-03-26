import { useCallback, useEffect, useRef, useState, useTransition } from "react";

interface UseInfiniteScrollOptions<
  TItem,
  TFilter extends string,
  TSort extends string,
> {
  initialItems: TItem[];
  initialHasMore: boolean;
  initialFilter: TFilter;
  initialSort: TSort;
  fetchMore: (
    offset: number,
    filter: TFilter,
    sort: TSort
  ) => Promise<{ items: TItem[]; hasMore: boolean }>;
}

interface UseInfiniteScrollResult<
  TItem,
  TFilter extends string,
  TSort extends string,
> {
  items: TItem[];
  hasMore: boolean;
  isPending: boolean;
  activeFilter: TFilter;
  activeSort: TSort;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  changeFilter: (filter: TFilter) => void;
  changeSort: (sort: TSort) => void;
}

/**
 * 無限スクロール + フィルター切り替え + ソート切り替えを管理する汎用フック
 * - IntersectionObserverでsentinel要素の可視性を監視し、自動で次ページを読み込む
 * - フィルターまたはソート切り替え時はリストをリセットして先頭から再取得する
 * - stale response対策としてバージョンを管理する
 */
export function useInfiniteScroll<
  TItem,
  TFilter extends string,
  TSort extends string,
>({
  initialItems,
  initialHasMore,
  initialFilter,
  initialSort,
  fetchMore,
}: UseInfiniteScrollOptions<TItem, TFilter, TSort>): UseInfiniteScrollResult<
  TItem,
  TFilter,
  TSort
> {
  const [activeFilter, setActiveFilter] = useState<TFilter>(initialFilter);
  const [activeSort, setActiveSort] = useState<TSort>(initialSort);
  const [items, setItems] = useState<TItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialItems.length);
  const versionRef = useRef(0);
  const isPendingRef = useRef(false);
  isPendingRef.current = isPending;

  const resetAndFetch = useCallback(
    (filter: TFilter, sort: TSort) => {
      offsetRef.current = 0;
      const version = ++versionRef.current;

      startTransition(async () => {
        const result = await fetchMore(0, filter, sort);
        if (versionRef.current !== version) return;
        setItems(result.items);
        setHasMore(result.hasMore);
        offsetRef.current = result.items.length;
      });
    },
    [fetchMore]
  );

  const changeFilter = useCallback(
    (filter: TFilter) => {
      if (filter === activeFilter) return;
      setActiveFilter(filter);
      resetAndFetch(filter, activeSort);
    },
    [activeFilter, activeSort, resetAndFetch]
  );

  const changeSort = useCallback(
    (sort: TSort) => {
      if (sort === activeSort) return;
      setActiveSort(sort);
      resetAndFetch(activeFilter, sort);
    },
    [activeFilter, activeSort, resetAndFetch]
  );

  const loadMore = useCallback(() => {
    if (isPendingRef.current || !hasMore) return;
    const version = versionRef.current;

    startTransition(async () => {
      const result = await fetchMore(
        offsetRef.current,
        activeFilter,
        activeSort
      );
      if (versionRef.current !== version) return;
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      offsetRef.current += result.items.length;
    });
  }, [hasMore, activeFilter, activeSort, fetchMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    items,
    hasMore,
    isPending,
    activeFilter,
    activeSort,
    sentinelRef,
    changeFilter,
    changeSort,
  };
}
