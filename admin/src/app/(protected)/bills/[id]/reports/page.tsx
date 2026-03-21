import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { routes } from "@/lib/routes";
import { InterviewStatistics } from "@/features/interview-reports/server/components/interview-statistics";
import { SessionList } from "@/features/interview-reports/server/components/session-list";
import { getInterviewStatistics } from "@/features/interview-reports/server/loaders/get-interview-statistics";
import {
  getInterviewSessions,
  getInterviewSessionsCount,
} from "@/features/interview-reports/server/loaders/get-interview-sessions";
import { parseSessionSortParams } from "@/features/interview-reports/shared/utils/parse-session-sort-params";

interface ReportsPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function ReportsPage({
  params,
  searchParams,
}: ReportsPageProps) {
  const { id } = await params;
  const { page, sort, order } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const sortConfig = parseSessionSortParams(sort, order);

  const [bill, sessions, totalCount, statistics] = await Promise.all([
    getBillById(id),
    getInterviewSessions(id, currentPage, sortConfig),
    getInterviewSessionsCount(id),
    getInterviewStatistics(id),
  ]);

  if (!bill) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.bills()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          議案一覧に戻る
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          インタビューレポート一覧
        </h1>
        <p className="text-gray-600 mt-1">議案「{bill.name}」のレポート</p>
      </div>

      {statistics && (
        <div className="mb-6">
          <InterviewStatistics statistics={statistics} />
        </div>
      )}

      <SessionList
        billId={id}
        sessions={sessions}
        totalCount={totalCount}
        currentPage={currentPage}
        sort={sortConfig}
      />
    </div>
  );
}
