import "server-only";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportCard } from "../../shared/components/report-card";
import type { PublicInterviewReport } from "../loaders/get-public-reports-by-bill-id";

interface BillInterviewOpinionsSectionProps {
  billId: string;
  reports: PublicInterviewReport[];
  totalCount: number;
}

export function BillInterviewOpinionsSection({
  billId,
  reports,
  totalCount,
}: BillInterviewOpinionsSectionProps) {
  if (reports.length === 0) {
    return null;
  }

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

      {/* レポートカード一覧 */}
      <div className="flex flex-col gap-4">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      {/* もっと読むリンク */}
      {totalCount > reports.length && (
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href={`/bills/${billId}/opinions`}>
              もっと読む
              <ChevronRight size={16} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
