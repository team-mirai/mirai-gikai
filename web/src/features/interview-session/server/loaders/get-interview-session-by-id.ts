import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewSession } from "../../shared/types";
import {
  getAuthenticatedUser,
  isSessionOwner,
} from "../utils/verify-session-ownership";

export type InterviewSessionWithBillId = InterviewSession & {
  bill_id: string;
};

/**
 * セッションIDからインタビューセッション詳細を取得（完了済みセッション含む）
 * 認可チェック: セッションの所有者のみがセッション情報を取得できる
 */
export async function getInterviewSessionById(
  sessionId: string
): Promise<InterviewSessionWithBillId | null> {
  const authResult = await getAuthenticatedUser();

  if (!authResult.authenticated) {
    console.error("Failed to get user:", authResult.error);
    return null;
  }

  const { userId } = authResult;
  const supabase = createAdminClient();

  // セッションとinterview_configを結合して取得
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*, interview_configs(bill_id)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    console.error("Failed to fetch interview session:", sessionError);
    return null;
  }

  // 認可チェック: セッションの所有者と現在のユーザーが一致するか
  if (!isSessionOwner(session.user_id, userId)) {
    console.error("Unauthorized access to interview session");
    return null;
  }

  // interview_configsからbill_idを抽出
  const interviewConfig = session.interview_configs as {
    bill_id: string;
  } | null;
  if (!interviewConfig) {
    console.error("Interview config not found for session");
    return null;
  }

  // セッションデータを返す（bill_idを追加）
  const { interview_configs: _, ...sessionData } = session;
  return {
    ...sessionData,
    bill_id: interviewConfig.bill_id,
  };
}
