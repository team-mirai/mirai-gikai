import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { MessageSearchForm } from "@/features/interview-reports/client/components/message-search-form";
import { MessageSearchResults } from "@/features/interview-reports/server/components/message-search-results";
import { searchUserMessages } from "@/features/interview-reports/server/loaders/search-user-messages";
import { routes } from "@/lib/routes";

interface ReportsSearchPageProps {
  params: Promise<{
    id: string;
    configId: string;
  }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function ReportsSearchPage({
  params,
  searchParams,
}: ReportsSearchPageProps) {
  const { id, configId } = await params;
  const { q, page } = await searchParams;
  const query = (q ?? "").trim();
  const currentPage = Math.max(1, Number(page) || 1);

  const [bill, result] = await Promise.all([
    getBillById(id),
    query ? searchUserMessages(configId, query, currentPage) : null,
  ]);

  if (!bill) {
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
        <h1 className="text-2xl font-bold text-gray-900">発言検索</h1>
        <p className="text-gray-600 mt-1">
          議案「{bill.name}」のインタビューでのユーザー発言を検索
        </p>
      </div>

      <div className="mb-6">
        <MessageSearchForm initialQuery={query} />
      </div>

      {result ? (
        <MessageSearchResults
          billId={id}
          configId={configId}
          query={query}
          result={result}
          currentPage={currentPage}
        />
      ) : (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          キーワードを入力して検索してください
        </div>
      )}
    </div>
  );
}
