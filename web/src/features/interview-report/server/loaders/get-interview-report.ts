import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";
import type { InterviewReport } from "../../shared/types";

/**
 * セッションIDからインタビューレポートを取得
 * 認可チェック: セッションの所有者のみがレポートを取得できる
 */
export async function getInterviewReport(
  sessionId: string
): Promise<InterviewReport | null> {
  const ownershipResult = await verifySessionOwnership(sessionId);

  if (!ownershipResult.authorized) {
    console.error(
      "Unauthorized access to interview report:",
      ownershipResult.error
    );
    return null;
  }

  const supabase = createAdminClient();

  // レポートを取得
  const { data: report, error: reportError } = await supabase
    .from("interview_report")
    .select("*")
    .eq("interview_session_id", sessionId)
    .single();

  if (reportError) {
    console.error("Failed to fetch interview report:", reportError);
    return null;
  }

  return report;
}
