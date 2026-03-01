"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAnonymousSupabaseUser } from "@/features/chat/client/hooks/use-anonymous-supabase-user";
import { ReactionButtonsInline } from "@/features/report-reaction/client/components/reaction-buttons-inline";
import type { ReportReactionData } from "@/features/report-reaction/shared/types";
import { ReportCard } from "../../shared/components/report-card";
import type { PublicInterviewReport } from "../../server/loaders/get-public-reports-by-bill-id";
import {
  type StanceFilter,
  countReportsByStance,
  filterReportsByStance,
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

interface PublicOpinionsListProps {
  reports: PublicInterviewReport[];
  billId: string;
  reactionsRecord: Record<
    string,
    { counts: { helpful: number; hmm: number }; userReaction: string | null }
  >;
}

export function PublicOpinionsList({
  reports,
  billId,
  reactionsRecord,
}: PublicOpinionsListProps) {
  useAnonymousSupabaseUser();
  const [activeFilter, setActiveFilter] = useState<StanceFilter>("all");

  const counts = useMemo(() => countReportsByStance(reports), [reports]);
  const filteredReports = useMemo(
    () => filterReportsByStance(reports, activeFilter),
    [reports, activeFilter]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* セクションヘッダー */}
      <div className="flex items-center gap-4">
        <h2 className="text-[22px] font-bold leading-[1.636] text-mirai-text">
          <span className="mr-1">💬</span>法案に対する当事者の意見
        </h2>
        <span className="text-[22px] font-bold leading-[1.636] text-mirai-text">
          {reports.length}件
        </span>
      </div>

      {/* フィルター */}
      <div className="flex gap-3 overflow-x-auto">
        {stanceFilterOrder.map((filter) => (
          <_FilterChip
            key={filter}
            label={stanceFilterLabels[filter]}
            count={counts[filter]}
            isActive={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          />
        ))}
      </div>

      {/* レポートカード一覧 */}
      <div className="flex flex-col gap-4">
        {filteredReports.map((report) => {
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
            <div key={report.id} className="flex flex-col">
              <ReportCard report={report} />
              <div className="bg-white rounded-b-lg px-4 pb-3 -mt-1">
                <ReactionButtonsInline
                  reportId={report.id}
                  billId={billId}
                  initialData={reactionData}
                />
              </div>
            </div>
          );
        })}
        {filteredReports.length === 0 && (
          <p className="text-center text-mirai-text-muted py-8">
            該当する意見はありません
          </p>
        )}
      </div>
    </div>
  );
}
