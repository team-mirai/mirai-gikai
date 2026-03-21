import "server-only";

import type { Route } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { ReactionButtonsInline } from "@/features/report-reaction/client/components/reaction-buttons-inline";
import { AnonymousAuthProvider } from "@/features/report-reaction/client/components/report-card-with-reactions";
import { getReportReactionsBatch } from "@/features/report-reaction/server/loaders/get-report-reactions";
import { ReportCard } from "../../shared/components/report-card";
import type { PublicInterviewReport } from "../loaders/get-public-reports-by-bill-id";

interface BillInterviewOpinionsSectionProps {
  billId: string;
  reports: PublicInterviewReport[];
  totalCount: number;
}

export async function BillInterviewOpinionsSection({
  billId,
  reports,
  totalCount,
}: BillInterviewOpinionsSectionProps) {
  if (reports.length === 0) {
    return null;
  }

  const reportIds = reports.map((r) => r.id);
  const reactionsMap = await getReportReactionsBatch(reportIds);

  const defaultReactionData = {
    counts: { helpful: 0, hmm: 0 },
    userReaction: null,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* セクションヘッダー */}
      <div className="flex items-center gap-4">
        <h2 className="text-[22px] font-bold leading-[1.636]">
          <span className="mr-1">💬</span>法案が関係する方のご意見
        </h2>
        <span className="text-[22px] font-bold leading-[1.636]">
          {totalCount}件
        </span>
      </div>

      {/* レポートカード一覧（リアクション付き） */}
      <AnonymousAuthProvider>
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <div key={report.id} className="flex flex-col">
              <ReportCard report={report} />
              <div className="bg-white rounded-b-lg px-4 pb-3 -mt-1">
                <ReactionButtonsInline
                  reportId={report.id}
                  initialData={
                    reactionsMap.get(report.id) ?? defaultReactionData
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </AnonymousAuthProvider>

      {/* もっと読むリンク */}
      {totalCount > reports.length && (
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href={routes.billOpinions(billId) as Route}>
              もっと読む
              <ChevronRight size={16} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
