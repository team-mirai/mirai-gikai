import { useCallback, useEffect, useRef, useState, useTransition } from "react";

interface UseInfiniteScrollOptions<TItem, TFilter extends string> {
  initialItems: TItem[];
  initialHasMore: boolean;
  initialFilter: TFilter;
  fetchMore: (
    offset: number,
    filter: TFilter
  ) => Promise<{ items: TItem[]; hasMore: boolean }>;
}

interface UseInfiniteScrollResult<TItem, TFilter extends string> {
  items: TItem[];
  hasMore: boolean;
  isPending: boolean;
  activeFilter: TFilter;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  changeFilter: (filter: TFilter) => void;
}

/**
 * 無限スクロール + フィルター切り替えを管理する汎用フック
 * - IntersectionObserverでsentinel要素の可視性を監視し、自動で次ページを読み込む
 * - フィルター切り替え時はリストをリセットして先頭から再取得する
 * - stale response対策としてフィルターバージョンを管理する
 */
export function useInfiniteScroll<TItem, TFilter extends string>({
  initialItems,
  initialHasMore,
  initialFilter,
  fetchMore,
}: UseInfiniteScrollOptions<TItem, TFilter>): UseInfiniteScrollResult<
  TItem,
  TFilter
> {
  const [activeFilter, setActiveFilter] = useState<TFilter>(initialFilter);
  const [items, setItems] = useState<TItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialItems.length);
  const filterVersionRef = useRef(0);
  const isPendingRef = useRef(false);
  isPendingRef.current = isPending;

  const changeFilter = useCallback(
    (filter: TFilter) => {
      if (filter === activeFilter) return;
      setActiveFilter(filter);
      offsetRef.current = 0;
      const version = ++filterVersionRef.current;

      startTransition(async () => {
        const result = await fetchMore(0, filter);
        if (filterVersionRef.current !== version) return;
        setItems(result.items);
        setHasMore(result.hasMore);
        offsetRef.current = result.items.length;
      });
    },
    [activeFilter, fetchMore]
  );

  const loadMore = useCallback(() => {
    if (isPendingRef.current || !hasMore) return;
    const version = filterVersionRef.current;

    startTransition(async () => {
      const result = await fetchMore(offsetRef.current, activeFilter);
      if (filterVersionRef.current !== version) return;
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      offsetRef.current += result.items.length;
    });
  }, [hasMore, activeFilter, fetchMore]);

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

  return { items, hasMore, isPending, activeFilter, sentinelRef, changeFilter };
}
