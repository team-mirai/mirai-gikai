import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { InterviewConfigForm } from "@/features/interview-config/client/components/interview-config-form";
import { InterviewQuestionList } from "@/features/interview-config/client/components/interview-question-list";
import { getInterviewConfigById } from "@/features/interview-config/server/loaders/get-interview-config";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";

interface InterviewEditPageProps {
  params: Promise<{
    id: string;
    configId: string;
  }>;
}

export default async function InterviewEditPage({
  params,
}: InterviewEditPageProps) {
  const { id, configId } = await params;
  const [bill, config] = await Promise.all([
    getBillById(id),
    getInterviewConfigById(configId),
  ]);

  if (!bill || !config) {
    notFound();
  }

  const questions = await getInterviewQuestions(config.id);

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
          インタビュー設定編集
        </h1>
        <p className="text-gray-600 mt-1">
          議案「{bill.name}」のインタビュー設定「{config.name}」を編集します
        </p>
      </div>

      <div className="space-y-6">
        <InterviewConfigForm billId={bill.id} config={config} />
        <InterviewQuestionList
          interviewConfigId={config.id}
          questions={questions}
        />
      </div>
    </div>
  );
}
