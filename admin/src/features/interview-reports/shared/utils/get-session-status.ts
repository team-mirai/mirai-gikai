export type SessionStatus = "completed" | "in_progress";

/**
 * completed_atの有無でセッションステータスを判定する
 */
export function getSessionStatus(session: {
  completed_at: string | null;
}): SessionStatus {
  return session.completed_at ? "completed" : "in_progress";
}
