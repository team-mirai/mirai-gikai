import "server-only";

import type { Route } from "next";
import Link from "next/link";
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
        <div className="relative flex flex-col gap-4">
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

          {/* もっと読むリンク（グラデーションオーバーレイ付き） */}
          {totalCount > reports.length && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[164px] bg-mirai-white-fade rounded-b-2xl">
              <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-auto">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="w-[214px] h-12 text-base font-bold border-mirai-text rounded-full hover:bg-gray-50 bg-white"
                >
                  <Link href={routes.billOpinions(billId) as Route}>
                    もっと読む
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </AnonymousAuthProvider>
    </div>
  );
}
