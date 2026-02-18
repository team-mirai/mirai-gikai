import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

export type InterviewSessionStatus = "active" | "completed" | "none";

export interface LatestInterviewSession {
  id: string;
  status: InterviewSessionStatus;
  reportId: string | null;
}

/**
 * 最新のインタビューセッション情報を取得
 * - 進行中（active）: completed_at = null, archived_at = null
 * - 完了（completed）: completed_at != null, archived_at = null
 * - なし（none）: セッションがない、またはすべてアーカイブ済み
 */
export async function getLatestInterviewSession(
  interviewConfigId: string
): Promise<LatestInterviewSession | null> {
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return null;
  }

  const supabase = createAdminClient();

  // アーカイブされていない最新のセッションを取得（完了済みも含む）
  const { data: session, error } = await supabase
    .from("interview_sessions")
    .select("id, completed_at, interview_report(id)")
    .eq("interview_config_id", interviewConfigId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch latest interview session:", error);
    return null;
  }

  if (!session) {
    return null;
  }

  const isCompleted = session.completed_at !== null;
  const report = session.interview_report as { id: string } | null;

  return {
    id: session.id,
    status: isCompleted ? "completed" : "active",
    reportId: report?.id ?? null,
  };
}
