"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnonymousSupabaseUser } from "@/features/chat/client/hooks/use-anonymous-supabase-user";
import { ReactionButtonsInline } from "@/features/report-reaction/client/components/reaction-buttons-inline";
import type { ReportReactionData } from "@/features/report-reaction/shared/types";
import { fetchMorePublicReports } from "../../server/actions/fetch-more-public-reports";
import { ReportCard } from "../../shared/components/report-card";
import type { PublicInterviewReport } from "../../server/loaders/get-public-reports-by-bill-id";
import {
  type StanceCounts,
  type StanceFilter,
  stanceFilterLabels,
  stanceFilterOrder,
} from "../../shared/utils/stance-filter";

function _FilterChip({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 rounded-[50px] h-[29px] text-sm font-bold transition-colors",
        isActive
          ? "bg-mirai-gradient text-mirai-text"
          : "bg-white text-gray-300"
      )}
    >
      <span>{label}</span>
      <span className="text-xs font-bold">{count}</span>
    </button>
  );
}

type ReactionsRecord = Record<
  string,
  { counts: { helpful: number; hmm: number }; userReaction: string | null }
>;

interface PublicOpinionsListProps {
  billId: string;
  initialReports: PublicInterviewReport[];
  initialReactionsRecord: ReactionsRecord;
  stanceCounts: StanceCounts;
  initialHasMore: boolean;
}

export function PublicOpinionsList({
  billId,
  initialReports,
  initialReactionsRecord,
  stanceCounts,
  initialHasMore,
}: PublicOpinionsListProps) {
  useAnonymousSupabaseUser();
  const [activeFilter, setActiveFilter] = useState<StanceFilter>("all");
  const [reports, setReports] =
    useState<PublicInterviewReport[]>(initialReports);
  const [reactionsRecord, setReactionsRecord] = useState<ReactionsRecord>(
    initialReactionsRecord
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialReports.length);
  // stale response を防ぐためのバージョン管理
  const filterVersionRef = useRef(0);
  const isPendingRef = useRef(false);
  isPendingRef.current = isPending;

  const handleFilterChange = useCallback(
    (filter: StanceFilter) => {
      if (filter === activeFilter) return;
      setActiveFilter(filter);
      offsetRef.current = 0;
      const version = ++filterVersionRef.current;

      startTransition(async () => {
        const result = await fetchMorePublicReports(billId, 0, filter);
        // stale response を無視
        if (filterVersionRef.current !== version) return;
        setReports(result.reports);
        setReactionsRecord(result.reactionsRecord);
        setHasMore(result.hasMore);
        offsetRef.current = result.reports.length;
      });
    },
    [activeFilter, billId]
  );

  const loadMore = useCallback(() => {
    if (isPendingRef.current || !hasMore) return;
    const version = filterVersionRef.current;

    startTransition(async () => {
      const result = await fetchMorePublicReports(
        billId,
        offsetRef.current,
        activeFilter
      );
      // stale response を無視
      if (filterVersionRef.current !== version) return;
      setReports((prev) => [...prev, ...result.reports]);
      setReactionsRecord((prev) => ({
        ...prev,
        ...result.reactionsRecord,
      }));
      setHasMore(result.hasMore);
      offsetRef.current += result.reports.length;
    });
  }, [hasMore, billId, activeFilter]);

  // IntersectionObserverでスクロールを検知して自動読み込み
  useEffect(() => {
    const el = loadMoreRef.current;
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

  return (
    <div className="flex flex-col gap-4">
      {/* セクションヘッダー */}
      <div className="flex items-center gap-4">
        <h2 className="text-[22px] font-bold leading-[1.636] text-mirai-text">
          <span className="mr-1">💬</span>法案に対する当事者の意見
        </h2>
        <span className="text-[22px] font-bold leading-[1.636] text-mirai-text">
          {stanceCounts.all}件
        </span>
      </div>

      {/* フィルター */}
      <div className="flex gap-3 overflow-x-auto">
        {stanceFilterOrder.map((filter) => (
          <_FilterChip
            key={filter}
            label={stanceFilterLabels[filter]}
            count={stanceCounts[filter]}
            isActive={activeFilter === filter}
            onClick={() => handleFilterChange(filter)}
          />
        ))}
      </div>

      {/* レポートカード一覧 */}
      <div className="flex flex-col gap-4">
        {reports.map((report) => {
          const reaction = reactionsRecord[report.id];
          const reactionData: ReportReactionData = reaction
            ? {
                counts: reaction.counts,
                userReaction:
                  (reaction.userReaction as ReportReactionData["userReaction"]) ??
                  null,
              }
            : { counts: { helpful: 0, hmm: 0 }, userReaction: null };

          return (
            <ReportCard key={report.id} report={report}>
              <ReactionButtonsInline
                reportId={report.id}
                initialData={reactionData}
              />
            </ReportCard>
          );
        })}

        {/* ローディング表示 & IntersectionObserver用sentinel */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isPending && (
              <Loader2 className="h-6 w-6 animate-spin text-mirai-text-muted" />
            )}
          </div>
        )}

        {!hasMore && reports.length === 0 && !isPending && (
          <p className="text-center text-mirai-text-muted py-8">
            該当する意見はありません
          </p>
        )}
      </div>
    </div>
  );
}
