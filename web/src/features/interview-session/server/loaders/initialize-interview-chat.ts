import "server-only";

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import type { InterviewMessage, InterviewSession } from "../../shared/types";
import {
  createInterviewSessionRecord,
  findActiveInterviewSession,
  findInterviewMessagesBySessionId,
} from "../repositories/interview-session-repository";
import type { GetUserFn } from "../utils/verify-session-ownership";

type InitializeInterviewChatDeps = {
  getUser?: GetUserFn;
};

type InitializeInterviewChatResult = {
  session: InterviewSession;
  messages: InterviewMessage[];
};

/**
 * インタビューチャットの初期化処理
 * セッション取得/作成、メッセージ履歴取得を行う
 * 初回質問の生成はクライアント側からAPIで行う（SSRのブロッキングを回避）
 */
export async function initializeInterviewChat(
  billId: string,
  interviewConfigId: string,
  deps?: InitializeInterviewChatDeps
): Promise<InitializeInterviewChatResult> {
  // 認証
  const getUser = deps?.getUser ?? getChatSupabaseUser;
  const {
    data: { user },
    error: getUserError,
  } = await getUser();

  if (getUserError || !user) {
    throw new Error(
      `Failed to get user: ${getUserError?.message || "User not found"}`
    );
  }

  // セッション取得または作成
  let session = await findActiveInterviewSession(interviewConfigId, user.id);
  if (!session) {
    session = await createInterviewSessionRecord({
      interviewConfigId,
      userId: user.id,
    });
  }

  // メッセージ履歴を取得
  const messages = await findInterviewMessagesBySessionId(session.id);

  return {
    session,
    messages,
  };
}
