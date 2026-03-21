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
  to: number,
  orderBy: {
    column: string;
    ascending: boolean;
  } = { column: "started_at", ascending: false }
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
    .order(orderBy.column, { ascending: orderBy.ascending })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch interview sessions: ${error.message}`);
  }

  return data;
}

export async function findSessionIdsOrderedByMessageCount(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "find_sessions_ordered_by_message_count",
    {
      p_config_id: configId,
      p_ascending: ascending,
      p_offset: offset,
      p_limit: limit,
    }
  );

  if (error) {
    throw new Error(
      `Failed to fetch sessions ordered by message count: ${error.message}`
    );
  }

  return (data || []).map((row) => row.session_id);
}

export async function findInterviewSessionsWithReportByIds(
  sessionIds: string[]
) {
  if (sessionIds.length === 0) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      `
      *,
      interview_report(*)
    `
    )
    .in("id", sessionIds);

  if (error) {
    throw new Error(`Failed to fetch interview sessions: ${error.message}`);
  }

  // Preserve the order of sessionIds
  const dataMap = new Map(data.map((s) => [s.id, s]));
  return sessionIds.map((id) => dataMap.get(id)).filter(Boolean) as typeof data;
}

export async function findSessionIdsOrderedByTotalScore(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "find_sessions_ordered_by_total_score",
    {
      p_config_id: configId,
      p_ascending: ascending,
      p_offset: offset,
      p_limit: limit,
    }
  );

  if (error) {
    throw new Error(
      `Failed to fetch sessions ordered by total score: ${error.message}`
    );
  }

  return (data || []).map((row) => row.session_id);
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

export async function findReactionCountsByReportId(
  reportId: string
): Promise<{ helpful: number; hmm: number }> {
  const supabase = createAdminClient();
  const [helpfulResult, hmmResult] = await Promise.all([
    supabase
      .from("report_reactions")
      .select("*", { count: "exact", head: true })
      .eq("interview_report_id", reportId)
      .eq("reaction_type", "helpful"),
    supabase
      .from("report_reactions")
      .select("*", { count: "exact", head: true })
      .eq("interview_report_id", reportId)
      .eq("reaction_type", "hmm"),
  ]);

  if (helpfulResult.error) {
    throw new Error(
      `Failed to fetch helpful count: ${helpfulResult.error.message}`
    );
  }
  if (hmmResult.error) {
    throw new Error(`Failed to fetch hmm count: ${hmmResult.error.message}`);
  }

  return {
    helpful: helpfulResult.count ?? 0,
    hmm: hmmResult.count ?? 0,
  };
}

export async function findInterviewStatistics(configId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_interview_statistics", {
    p_config_id: configId,
  });

  if (error) {
    throw new Error(`Failed to fetch interview statistics: ${error.message}`);
  }

  return data?.[0] ?? null;
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
