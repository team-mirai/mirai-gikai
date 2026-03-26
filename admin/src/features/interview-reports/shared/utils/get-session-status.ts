export type SessionStatus = "completed" | "in_progress" | "archived";

/**
 * completed_at, archived_atの有無でセッションステータスを判定する
 */
export function getSessionStatus(session: {
  completed_at: string | null;
  archived_at: string | null;
}): SessionStatus {
  if (!session.completed_at && session.archived_at) {
    return "archived";
  }
  return session.completed_at ? "completed" : "in_progress";
}
