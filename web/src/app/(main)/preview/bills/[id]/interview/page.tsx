import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { getBillByIdAdmin } from "@/features/bills/server/loaders/get-bill-by-id-admin";
import { validatePreviewToken } from "@/features/bills/server/loaders/validate-preview-token";
import { InterviewLPPage } from "@/features/interview-config/client/components/interview-lp-page";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getLatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import { env } from "@/lib/env";

interface InterviewPreviewPageProps {
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

export default async function InterviewPreviewPage({
  params,
  searchParams,
}: InterviewPreviewPageProps) {
  const [{ id: billId }, { token }] = await Promise.all([params, searchParams]);

  // トークン検証
  const isValidToken = await validatePreviewToken(billId, token);
  if (!isValidToken) {
    notFound();
  }

  // 管理者用API（非公開議案/非公開設定も取得可能）を使用
  const [bill, interviewConfig] = await Promise.all([
    getBillByIdAdmin(billId),
    getInterviewConfigAdmin(billId),
  ]);

  if (!bill || !interviewConfig) {
    notFound();
  }

  // 最新のセッション情報を取得
  const latestSession = await getLatestInterviewSession(interviewConfig.id);

  return (
    <>
      <PreviewBanner />
      <InterviewLPPage
        bill={bill}
        interviewConfig={interviewConfig}
        sessionInfo={latestSession}
        previewToken={token}
      />
    </>
  );
}
