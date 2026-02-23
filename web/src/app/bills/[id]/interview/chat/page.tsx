import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { InterviewChatClient } from "@/features/interview-session/client/components/interview-chat-client";
import { InterviewSessionErrorView } from "@/features/interview-session/client/components/interview-session-error-view";
import { initializeInterviewChat } from "@/features/interview-session/server/loaders/initialize-interview-chat";

interface InterviewChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InterviewChatPage({
  params,
}: InterviewChatPageProps) {
  const { id: billId } = await params;

  // 法案とインタビュー設定を取得
  const [bill, interviewConfig] = await Promise.all([
    getBillById(billId),
    getInterviewConfig(billId),
  ]);

  if (!bill || !interviewConfig) {
    notFound();
  }

  // ループモードの場合のみ質問数を取得（プログレスバー用）
  const questions =
    interviewConfig.mode === "loop"
      ? await getInterviewQuestions(interviewConfig.id)
      : [];

  // インタビューチャットの初期化処理
  try {
    const { session, messages } = await initializeInterviewChat(
      billId,
      interviewConfig.id
    );

    return (
      <InterviewChatClient
        billId={billId}
        sessionId={session.id}
        initialMessages={messages}
        mode={interviewConfig.mode}
        totalQuestions={questions.length}
        estimatedDuration={interviewConfig.estimated_duration}
        sessionStartedAt={session.started_at}
      />
    );
  } catch (error) {
    console.error("Failed to initialize interview session:", error);
    return <InterviewSessionErrorView billId={billId} />;
  }
}
