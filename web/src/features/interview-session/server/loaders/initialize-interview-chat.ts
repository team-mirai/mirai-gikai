import "server-only";

import { createInterviewSession } from "@/features/interview-session/server/actions/create-interview-session";
import { getInterviewMessages } from "@/features/interview-session/server/loaders/get-interview-messages";
import { getInterviewSession } from "@/features/interview-session/server/loaders/get-interview-session";
import { generateInitialQuestion } from "@/features/interview-session/server/services/generate-initial-question";
import type { InterviewMessage, InterviewSession } from "../../shared/types";

type InitializeInterviewChatResult = {
  session: InterviewSession;
  messages: InterviewMessage[];
};

/**
 * インタビューチャットの初期化処理
 * セッション取得/作成、メッセージ履歴取得、最初の質問生成を行う
 */
export async function initializeInterviewChat(
  billId: string,
  interviewConfigId: string
): Promise<InitializeInterviewChatResult> {
  // セッション取得または作成
  let session = await getInterviewSession(interviewConfigId);
  if (!session) {
    session = await createInterviewSession({
      interviewConfigId,
    });
  }

  // メッセージ履歴を取得
  let messages = await getInterviewMessages(session.id);

  // メッセージ履歴が空の場合、最初の質問を生成
  if (messages.length === 0) {
    const initialQuestion = await generateInitialQuestion({
      sessionId: session.id,
      billId,
      interviewConfigId,
    });

    if (initialQuestion) {
      messages = [initialQuestion];
    }
  }

  return {
    session,
    messages,
  };
}
