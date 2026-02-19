import "server-only";

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import type { InterviewSession } from "../../shared/types";
import { findActiveInterviewSession } from "../repositories/interview-session-repository";

export async function getInterviewSession(
  interviewConfigId: string
): Promise<InterviewSession | null> {
  // 認可処理: バックエンド側でuserIdを取得
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    console.error("Failed to get user:", getUserError);
    return null;
  }

  try {
    return await findActiveInterviewSession(interviewConfigId, user.id);
  } catch (error) {
    console.error("Failed to fetch interview session:", error);
    return null;
  }
}
