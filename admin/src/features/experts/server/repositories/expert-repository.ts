import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";

export async function findExpertRegistrations() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expert_registrations")
    .select("id, name, email, affiliation, created_at, user_id")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch expert registrations: ${error.message}`);
  }
  return data;
}

export async function findCompletedSessionsWithReportsByUserIds(
  userIds: string[]
) {
  if (userIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      `
      id,
      user_id,
      interview_report(id, stance),
      interview_configs!inner(id, bill_id, bills(id, name))
    `
    )
    .in("user_id", userIds)
    .not("completed_at", "is", null);

  if (error) {
    throw new Error(`Failed to fetch sessions with reports: ${error.message}`);
  }

  return data;
}
