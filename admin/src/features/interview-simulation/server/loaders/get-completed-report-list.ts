import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export interface CompletedReportListItem {
  sessionId: string;
  reportId: string;
  roleTitle: string | null;
  role: string | null;
  stance: string | null;
  summary: string | null;
  totalContentRichness: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * 指定 config のうち completed_at が set された session に紐づく
 * interview_report 一覧を取得する。
 */
export async function getCompletedReportList(
  configId: string
): Promise<CompletedReportListItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      "id, started_at, completed_at, interview_report!inner(id, role, role_title, stance, summary, total_content_richness)"
    )
    .eq("interview_config_id", configId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch completed reports: ${error.message}`);
  }

  return (data ?? []).flatMap((session) => {
    const report = Array.isArray(session.interview_report)
      ? session.interview_report[0]
      : session.interview_report;
    if (!report) return [];
    return [
      {
        sessionId: session.id,
        reportId: report.id,
        roleTitle: report.role_title ?? null,
        role: report.role ?? null,
        stance: report.stance ?? null,
        summary: report.summary ?? null,
        totalContentRichness: report.total_content_richness ?? null,
        startedAt: session.started_at ?? null,
        completedAt: session.completed_at ?? null,
      },
    ];
  });
}
