import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import type { InterviewSession } from "../../shared/types";

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

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("interview_config_id", interviewConfigId)
    .eq("user_id", user.id)
    .is("completed_at", null) // 未完了のセッションのみ
    .is("archived_at", null) // アーカイブされていないセッションのみ
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch interview session:", error);
    return null;
  }

  return data;
}
