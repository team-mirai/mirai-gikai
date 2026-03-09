import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function findInterviewConfigIdByBillId(
  billId: string
): Promise<{ id: string } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("id")
    .eq("bill_id", billId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch interview config: ${error.message}`);
  }

  return data;
}

export async function findInterviewSessionsWithReport(
  configId: string,
  from: number,
  to: number
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      `
      *,
      interview_report(*)
    `
    )
    .eq("interview_config_id", configId)
    .order("started_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch interview sessions: ${error.message}`);
  }

  return data;
}

export async function findInterviewMessageCounts(sessionIds: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_interview_message_counts", {
    session_ids: sessionIds,
  });

  if (error) {
    throw new Error(`Failed to fetch message counts: ${error.message}`);
  }

  return data;
}

export async function countInterviewSessionsByConfigId(
  configId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("interview_sessions")
    .select("*", { count: "exact", head: true })
    .eq("interview_config_id", configId);

  if (error) {
    throw new Error(`Failed to fetch session count: ${error.message}`);
  }

  return count || 0;
}

export async function findInterviewSessionById(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch interview session: ${error.message}`);
  }

  return data;
}

export async function findInterviewReportBySessionId(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select("*")
    .eq("interview_session_id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch interview report: ${error.message}`);
  }

  return data;
}

export async function findInterviewMessagesBySessionId(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch interview messages: ${error.message}`);
  }

  return data;
}

export async function updateReportVisibility(
  reportId: string,
  isPublic: boolean
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_report")
    .update({ is_public_by_admin: isPublic })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Failed to update report visibility: ${error.message}`);
  }
}
