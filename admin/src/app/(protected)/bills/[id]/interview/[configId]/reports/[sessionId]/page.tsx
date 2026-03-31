import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { SessionDetail } from "@/features/interview-reports/server/components/session-detail";
import { getInterviewSessionDetail } from "@/features/interview-reports/server/loaders/get-interview-session-detail";
import { routes } from "@/lib/routes";

interface ReportDetailPageProps {
  params: Promise<{
    id: string;
    configId: string;
    sessionId: string;
  }>;
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const { id, configId, sessionId } = await params;
  const [bill, session] = await Promise.all([
    getBillById(id),
    getInterviewSessionDetail(sessionId),
  ]);

  if (!bill) {
    notFound();
  }

  if (!session) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.billReports(id, configId) as Route}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          レポート一覧に戻る
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">セッション詳細</h1>
        <p className="text-gray-600 mt-1">
          議案「{bill.name}」のインタビューセッション
        </p>
      </div>

      <SessionDetail session={session} billId={id} />
    </div>
  );
}
