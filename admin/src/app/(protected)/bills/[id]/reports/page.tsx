import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/loaders/get-bill-by-id";
import { SessionList } from "@/features/interview-reports/components/session-list";
import {
  getInterviewSessions,
  getInterviewSessionsCount,
} from "@/features/interview-reports/loaders/get-interview-sessions";

interface ReportsPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function ReportsPage({
  params,
  searchParams,
}: ReportsPageProps) {
  const { id } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const [bill, sessions, totalCount] = await Promise.all([
    getBillById(id),
    getInterviewSessions(id, currentPage),
    getInterviewSessionsCount(id),
  ]);

  if (!bill) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/bills"
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

      <SessionList
        billId={id}
        sessions={sessions}
        totalCount={totalCount}
        currentPage={currentPage}
      />
    </div>
  );
}
