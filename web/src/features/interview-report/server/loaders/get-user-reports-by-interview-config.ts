import "server-only";

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import { getReportReactionsBatch } from "@/features/report-reaction/server/loaders/get-report-reactions";
import type { ReportReactionData } from "@/features/report-reaction/shared/types";
import type { ReportCardData } from "../../shared/components/report-card";
import { findUserReportsByInterviewConfigId } from "../repositories/interview-report-repository";

export interface UserReportsResult {
  reports: ReportCardData[];
  reactionsRecord: Record<string, ReportReactionData>;
}

/**
 * ユーザーの過去のインタビューレポートとリアクション情報を取得
 */
export async function getUserReportsByInterviewConfig(
  interviewConfigId: string
): Promise<UserReportsResult | null> {
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return null;
  }

  const rawReports = await findUserReportsByInterviewConfigId(
    interviewConfigId,
    user.id
  );

  if (rawReports.length === 0) {
    return null;
  }

  const reports: ReportCardData[] = rawReports.map((r) => ({
    id: r.id,
    stance: r.stance,
    role: r.role,
    role_title: r.role_title,
    summary: r.summary,
    created_at: r.created_at,
  }));

  const reportIds = reports.map((r) => r.id);
  const reactionsMap = await getReportReactionsBatch(reportIds);
  const reactionsRecord = Object.fromEntries(reactionsMap) as Record<
    string,
    ReportReactionData
  >;

  return { reports, reactionsRecord };
}
