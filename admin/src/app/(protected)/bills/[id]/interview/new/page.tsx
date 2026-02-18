import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/loaders/get-bill-by-id";
import { InterviewConfigForm } from "@/features/interview-config/components/interview-config-form";

interface InterviewNewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InterviewNewPage({
  params,
}: InterviewNewPageProps) {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/bills/${id}/interview`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          インタビュー設定一覧に戻る
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          インタビュー設定作成
        </h1>
        <p className="text-gray-600 mt-1">
          議案「{bill.name}」の新しいインタビュー設定を作成します
        </p>
      </div>

      <InterviewConfigForm billId={bill.id} config={null} />
    </div>
  );
}
