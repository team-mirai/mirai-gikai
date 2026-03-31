import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { BatchModerationButton } from "@/features/interview-reports/client/components/batch-moderation-button";
import { BatchPublishButton } from "@/features/interview-reports/client/components/batch-publish-button";
import { InterviewStatistics } from "@/features/interview-reports/server/components/interview-statistics";
import { SessionList } from "@/features/interview-reports/server/components/session-list";
import {
  getInterviewSessions,
  getInterviewSessionsCount,
} from "@/features/interview-reports/server/loaders/get-interview-sessions";
import { getInterviewStatistics } from "@/features/interview-reports/server/loaders/get-interview-statistics";
import { parseSessionFilterParams } from "@/features/interview-reports/shared/utils/parse-session-filter-params";
import { parseSessionSortParams } from "@/features/interview-reports/shared/utils/parse-session-sort-params";
import { routes } from "@/lib/routes";

interface ReportsPageProps {
  params: Promise<{
    id: string;
    configId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    status?: string;
    visibility?: string;
    stance?: string;
    role?: string;
    moderation?: string;
  }>;
}

export default async function ReportsPage({
  params,
  searchParams,
}: ReportsPageProps) {
  const { id, configId } = await params;
  const { page, sort, order, status, visibility, stance, role, moderation } =
    await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const sortConfig = parseSessionSortParams(sort, order);
  const filterConfig = parseSessionFilterParams(
    status,
    visibility,
    stance,
    role,
    moderation
  );

  const [bill, sessions, totalCount, statistics] = await Promise.all([
    getBillById(id),
    getInterviewSessions(configId, currentPage, sortConfig, filterConfig),
    getInterviewSessionsCount(configId, filterConfig),
    getInterviewStatistics(configId),
  ]);

  if (!bill) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.billInterview(id) as Route}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          インタビュー設定に戻る
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            インタビューレポート一覧
          </h1>
          <p className="text-gray-600 mt-1">議案「{bill.name}」のレポート</p>
        </div>
        <div className="flex items-center gap-2">
          <BatchPublishButton billId={id} />
          <BatchModerationButton />
        </div>
      </div>

      {statistics && (
        <div className="mb-6">
          <InterviewStatistics statistics={statistics} />
        </div>
      )}

      <SessionList
        billId={id}
        configId={configId}
        sessions={sessions}
        totalCount={totalCount}
        currentPage={currentPage}
        sort={sortConfig}
        filters={filterConfig}
      />
    </div>
  );
}
