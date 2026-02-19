import "server-only";

import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";
import type { InterviewReport } from "../../shared/types";
import { findReportBySessionId } from "../repositories/interview-report-repository";

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

  try {
    return await findReportBySessionId(sessionId);
  } catch (error) {
    console.error("Failed to fetch interview report:", error);
    return null;
  }
}
