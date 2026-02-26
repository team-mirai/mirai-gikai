import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { InterviewChatClient } from "@/features/interview-session/client/components/interview-chat-client";
import { InterviewSessionErrorView } from "@/features/interview-session/client/components/interview-session-error-view";
import { VoiceInterviewClient } from "@/features/voice-interview/client/components/voice-interview-client";
import { initializeInterviewChat } from "@/features/interview-session/server/loaders/initialize-interview-chat";

interface InterviewChatPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    mode?: string;
  }>;
}

export default async function InterviewChatPage({
  params,
  searchParams,
}: InterviewChatPageProps) {
  const [{ id: billId }, { mode }] = await Promise.all([params, searchParams]);

  const isVoiceMode = mode === "voice";

  // 法案・インタビュー設定を並列取得
  const [bill, interviewConfig] = await Promise.all([
    getBillById(billId),
    getInterviewConfig(billId),
  ]);

  if (!bill || !interviewConfig) {
    notFound();
  }

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
        <VoiceInterviewClient
          key={session.id}
          billId={billId}
          initialMessages={initialVoiceMessages}
        />
      );
    }

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
