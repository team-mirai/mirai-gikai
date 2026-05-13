import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { InterviewConfigEditClient } from "@/features/interview-config/client/components/interview-config-edit-client";
import { generateDefaultConfigName } from "@/features/interview-config/shared/utils/default-config-name";
import { routes } from "@/lib/routes";

interface InterviewNewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InterviewNewPage({
  params,
}: InterviewNewPageProps) {
  const { id } = await params;
  const [bill, admin] = await Promise.all([getBillById(id), getCurrentAdmin()]);

  if (!bill) {
    notFound();
  }

  const username = admin?.email?.split("@")[0] || null;
  const initialName = username
    ? `${generateDefaultConfigName()} (${username})`
    : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.billInterview(id) as Route}
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

      <InterviewConfigEditClient
        billId={bill.id}
        config={null}
        questions={[]}
        completedReports={[]}
        initialName={initialName}
      />
    </div>
  );
}
