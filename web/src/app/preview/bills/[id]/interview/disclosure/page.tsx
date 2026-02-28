import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { getBillByIdAdmin } from "@/features/bills/server/loaders/get-bill-by-id-admin";
import { validatePreviewToken } from "@/features/bills/server/loaders/validate-preview-token";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { InterviewDisclosurePage } from "@/features/interview-config/server/components/interview-disclosure-page";
import { buildBulkModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/bulk-mode";
import { buildLoopModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/loop-mode";
import { buildSummarySystemPrompt } from "@/features/interview-session/shared/utils/build-summary-system-prompt";
import { env } from "@/lib/env";

interface DisclosurePreviewPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

function PreviewBanner() {
  return (
    <div className="sticky top-0 z-50 bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              プレビューモード - このインタビューは一般公開されていません
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={`${env.adminUrl}/bills`}
              className="text-yellow-700 hover:text-yellow-900 underline"
            >
              管理画面に戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DisclosurePreviewPage({
  params,
  searchParams,
}: DisclosurePreviewPageProps) {
  const [{ id: billId }, { token }] = await Promise.all([params, searchParams]);

  const isValidToken = await validatePreviewToken(billId, token);
  if (!isValidToken) {
    notFound();
  }

  const [bill, interviewConfig] = await Promise.all([
    getBillByIdAdmin(billId),
    getInterviewConfigAdmin(billId),
  ]);

  if (!bill || !interviewConfig) {
    notFound();
  }

  const questions = await getInterviewQuestions(interviewConfig.id);

  const mode = interviewConfig.mode ?? "loop";
  const buildSystemPrompt =
    mode === "bulk" ? buildBulkModeSystemPrompt : buildLoopModeSystemPrompt;

  const systemPrompt = buildSystemPrompt({
    bill,
    interviewConfig,
    questions,
    currentStage: "chat",
    askedQuestionIds: new Set(),
    remainingMinutes: null,
  });

  const summaryPrompt = buildSummarySystemPrompt({
    bill,
    interviewConfig,
    messages: [],
  });

  return (
    <>
      <PreviewBanner />
      <InterviewDisclosurePage
        billName={bill.name}
        billTitle={bill.bill_content?.title ?? bill.name}
        interviewConfig={interviewConfig}
        questions={questions}
        systemPrompt={systemPrompt}
        summaryPrompt={summaryPrompt}
      />
    </>
  );
}
