import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { validatePreviewToken } from "@/features/bills/server/loaders/validate-preview-token";
import { getBillByIdAdmin } from "@/features/bills/server/loaders/get-bill-by-id-admin";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { InterviewChatClient } from "@/features/interview-session/client/components/interview-chat-client";
import { InterviewSessionErrorView } from "@/features/interview-session/client/components/interview-session-error-view";
import { VoiceInterviewClient } from "@/features/voice-interview/client/components/voice-interview-client";
import { initializeInterviewChat } from "@/features/interview-session/server/loaders/initialize-interview-chat";
import { env } from "@/lib/env";

interface InterviewPreviewChatPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
    mode?: string;
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

export default async function InterviewPreviewChatPage({
  params,
  searchParams,
}: InterviewPreviewChatPageProps) {
  const [{ id: billId }, { token, mode }] = await Promise.all([
    params,
    searchParams,
  ]);

  // トークン検証
  const isValidToken = await validatePreviewToken(billId, token);
  if (!isValidToken) {
    notFound();
  }

  // 非公開設定も取得可能にする（bill と config を並列取得）
  const [interviewConfig, bill] = await Promise.all([
    getInterviewConfigAdmin(billId),
    getBillByIdAdmin(billId),
  ]);

  if (!interviewConfig) {
    notFound();
  }

  const isVoiceMode = mode === "voice";

  // 質問を取得（プログレスバー用 + 初期質問生成用）
  const questions = await getInterviewQuestions(interviewConfig.id);

  // インタビューチャットの初期化処理
  try {
    const { session, messages } = await initializeInterviewChat(
      billId,
      interviewConfig.id
    );

    // 音声モードの場合は VoiceInterviewClient を表示
    if (isVoiceMode && interviewConfig.voice_enabled) {
      const initialVoiceMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      return (
        <>
          <PreviewBanner />
          <VoiceInterviewClient
            key={session.id}
            billId={billId}
            initialMessages={initialVoiceMessages}
          />
        </>
      );
    }

    return (
      <>
        <PreviewBanner />
        <InterviewChatClient
          billId={billId}
          sessionId={session.id}
          initialMessages={messages}
          mode={interviewConfig.mode}
          totalQuestions={questions.length}
          estimatedDuration={interviewConfig.estimated_duration}
          sessionStartedAt={session.started_at}
        />
      </>
    );
  } catch (error) {
    console.error("Failed to initialize interview session (preview):", error);
    return (
      <>
        <PreviewBanner />
        <InterviewSessionErrorView billId={billId} previewToken={token} />
      </>
    );
  }
}
