import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewSessionForTsv } from "../../shared/utils/build-interview-tsv";

export async function getInterviewSessionsForTsv(
  configId: string
): Promise<InterviewSessionForTsv[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      `
      *,
      interview_report(*),
      interview_messages(*)
      `
    )
    .eq("interview_config_id", configId)
    .order("started_at", { ascending: true })
    .order("created_at", {
      referencedTable: "interview_messages",
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Failed to fetch interview sessions for TSV: ${error.message}`
    );
  }

  return (data ?? []).map((session) => {
    // 1:1 リレーションでも Supabase の生成型では配列で返るケースがあるため正規化
    const reportRelation = session.interview_report;
    const report = Array.isArray(reportRelation)
      ? (reportRelation[0] ?? null)
      : reportRelation;
    return {
      ...session,
      interview_report: report,
      interview_messages: session.interview_messages ?? [],
    };
  });
}
