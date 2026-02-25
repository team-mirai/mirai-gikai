import "server-only";

import { createInterviewSession } from "@/features/interview-session/server/actions/create-interview-session";
import { getInterviewMessages } from "@/features/interview-session/server/loaders/get-interview-messages";
import { getInterviewSession } from "@/features/interview-session/server/loaders/get-interview-session";
import {
  generateInitialQuestion,
  type GenerateQuestionDeps,
} from "@/features/interview-session/server/services/generate-initial-question";
import type { InterviewMessage, InterviewSession } from "../../shared/types";

type InitializeInterviewChatResult = {
  session: InterviewSession;
  messages: InterviewMessage[];
};

/**
 * インタビューチャットの初期化処理
 * セッション取得/作成、メッセージ履歴取得、最初の質問生成を行う
 *
 * @param prefetched - page.tsx で既に取得済みのデータ。渡すと初期質問生成時のDB重複クエリをスキップ
 */
export async function initializeInterviewChat(
  billId: string,
  interviewConfigId: string,
  options?: {
    prefetched?: Parameters<typeof generateInitialQuestion>[0]["prefetched"];
    deps?: GenerateQuestionDeps;
  }
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
      prefetched: options?.prefetched,
      deps: options?.deps,
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
