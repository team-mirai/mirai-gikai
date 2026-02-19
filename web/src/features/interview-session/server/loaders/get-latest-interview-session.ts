import "server-only";

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import { findLatestNonArchivedSession } from "../repositories/interview-session-repository";

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

  let session: Awaited<ReturnType<typeof findLatestNonArchivedSession>>;
  try {
    session = await findLatestNonArchivedSession(interviewConfigId, user.id);
  } catch (error) {
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
