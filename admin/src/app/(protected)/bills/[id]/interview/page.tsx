import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBills } from "@/features/bills/server/loaders/get-bills";
import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { InterviewConfigList } from "@/features/interview-config/client/components/interview-config-list";
import {
  getInterviewConfigs,
  getSessionCountsByConfigIds,
} from "@/features/interview-config/server/loaders/get-interview-config";
import { routes } from "@/lib/routes";

interface InterviewListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InterviewListPage({
  params,
}: InterviewListPageProps) {
  const { id } = await params;
  const [bill, configs, allBillsResult] = await Promise.all([
    getBillById(id),
    getInterviewConfigs(id),
    // 他法案コピー用のセカンダリ UI 用途。失敗しても本ページのコア機能は維持したいため、握り潰して空配列にフォールバックする。
    getBills().catch((error) => {
      console.error("Failed to load bills for copy dialog:", error);
      return [];
    }),
  ]);

  if (!bill) {
    notFound();
  }

  const sessionCounts = await getSessionCountsByConfigIds(
    configs.map((c) => c.id)
  );

  const billOptions = allBillsResult.map((b) => ({ id: b.id, name: b.name }));

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
        <h1 className="text-2xl font-bold text-gray-900">インタビュー設定</h1>
        <p className="text-gray-600 mt-1">
          議案「{bill.name}」のインタビュー設定を管理します
        </p>
      </div>

      <InterviewConfigList
        billId={bill.id}
        configs={configs}
        sessionCounts={sessionCounts}
        bills={billOptions}
      />
    </div>
  );
}
