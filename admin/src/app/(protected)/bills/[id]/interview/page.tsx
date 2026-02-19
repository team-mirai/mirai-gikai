import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/loaders/get-bill-by-id";
import { InterviewConfigList } from "@/features/interview-config/client/components/interview-config-list";
import { getInterviewConfigs } from "@/features/interview-config/server/loaders/get-interview-config";

interface InterviewListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InterviewListPage({
  params,
}: InterviewListPageProps) {
  const { id } = await params;
  const [bill, configs] = await Promise.all([
    getBillById(id),
    getInterviewConfigs(id),
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
        <h1 className="text-2xl font-bold text-gray-900">インタビュー設定</h1>
        <p className="text-gray-600 mt-1">
          議案「{bill.name}」のインタビュー設定を管理します
        </p>
      </div>

      <InterviewConfigList billId={bill.id} configs={configs} />
    </div>
  );
}
