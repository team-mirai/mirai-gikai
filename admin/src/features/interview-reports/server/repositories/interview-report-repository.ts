import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { SessionFilterConfig } from "../../shared/types";
import { DEFAULT_SESSION_FILTER } from "../../shared/types";

function toRpcFilterParams(filters: SessionFilterConfig) {
  return {
    p_status: filters.status !== "all" ? (filters.status as string) : undefined,
    p_visibility:
      filters.visibility !== "all" ? (filters.visibility as string) : undefined,
    p_stance: filters.stance !== "all" ? (filters.stance as string) : undefined,
    p_role: filters.role !== "all" ? (filters.role as string) : undefined,
  };
}

function hasReportLevelFilters(filters: SessionFilterConfig): boolean {
  return (
    filters.visibility !== "all" ||
    filters.stance !== "all" ||
    filters.role !== "all"
  );
}

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
  } = { column: "started_at", ascending: false },
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
) {
  const supabase = createAdminClient();
  const useInnerJoin = hasReportLevelFilters(filters);
  const selectQuery = useInnerJoin
    ? "*, interview_report!inner(*)"
    : "*, interview_report(*)";

  let query = supabase
    .from("interview_sessions")
    .select(selectQuery)
    .eq("interview_config_id", configId);

  // ステータスフィルタ
  if (filters.status === "completed") {
    query = query.not("completed_at", "is", null);
  } else if (filters.status === "in_progress") {
    query = query.is("completed_at", null);
  }

  // レポートレベルフィルタ（inner join使用時のみ有効）
  if (filters.visibility === "public") {
    query = query.eq("interview_report.is_public_by_admin", true);
  } else if (filters.visibility === "private") {
    query = query.eq("interview_report.is_public_by_admin", false);
  }

  if (filters.stance !== "all") {
    query = query.eq("interview_report.stance", filters.stance);
  }

  if (filters.role !== "all") {
    query = query.eq("interview_report.role", filters.role);
  }

  const { data, error } = await query
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
  limit: number,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "find_sessions_ordered_by_message_count",
    {
      p_config_id: configId,
      p_ascending: ascending,
      p_offset: offset,
      p_limit: limit,
      ...toRpcFilterParams(filters),
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

export async function findFilteredSessionIds(
  configId: string,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  const supabase = createAdminClient();

  // レポートレベルフィルタがある場合はreport経由でセッションIDを取得
  if (hasReportLevelFilters(filters)) {
    let reportQuery = supabase
      .from("interview_report")
      .select("interview_session_id, interview_sessions!inner(id)")
      .eq("interview_sessions.interview_config_id", configId);

    if (filters.status === "completed") {
      reportQuery = reportQuery.not(
        "interview_sessions.completed_at",
        "is",
        null
      );
    } else if (filters.status === "in_progress") {
      reportQuery = reportQuery.is("interview_sessions.completed_at", null);
    }

    if (filters.visibility === "public") {
      reportQuery = reportQuery.eq("is_public_by_admin", true);
    } else if (filters.visibility === "private") {
      reportQuery = reportQuery.eq("is_public_by_admin", false);
    }

    if (filters.stance !== "all") {
      reportQuery = reportQuery.eq("stance", filters.stance);
    }

    if (filters.role !== "all") {
      reportQuery = reportQuery.eq("role", filters.role);
    }

    const { data, error } = await reportQuery;

    if (error) {
      throw new Error(`Failed to fetch filtered session ids: ${error.message}`);
    }

    return (data || []).map((row) => row.interview_session_id);
  }

  // セッションレベルフィルタのみの場合
  let query = supabase
    .from("interview_sessions")
    .select("id")
    .eq("interview_config_id", configId);

  if (filters.status === "completed") {
    query = query.not("completed_at", "is", null);
  } else if (filters.status === "in_progress") {
    query = query.is("completed_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch filtered session ids: ${error.message}`);
  }

  return (data || []).map((row) => row.id);
}

export async function findSessionIdsOrderedByTotalContentRichness(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "find_sessions_ordered_by_total_content_richness",
    {
      p_config_id: configId,
      p_ascending: ascending,
      p_offset: offset,
      p_limit: limit,
      ...toRpcFilterParams(filters),
    }
  );

  if (error) {
    throw new Error(
      `Failed to fetch sessions ordered by total content richness: ${error.message}`
    );
  }

  return (data || []).map((row) => row.session_id);
}

export async function findSessionIdsOrderedByHelpfulCount(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "find_sessions_ordered_by_helpful_count",
    {
      p_config_id: configId,
      p_ascending: ascending,
      p_offset: offset,
      p_limit: limit,
      ...toRpcFilterParams(filters),
    }
  );

  if (error) {
    throw new Error(
      `Failed to fetch sessions ordered by helpful count: ${error.message}`
    );
  }

  return (data || []).map((row) => row.session_id);
}

export async function findHelpfulCountsByReportIds(
  reportIds: string[]
): Promise<Map<string, number>> {
  const countsMap = new Map<string, number>();
  if (reportIds.length === 0) return countsMap;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("count_reactions_by_report_ids", {
    report_ids: reportIds,
  });

  if (error) {
    throw new Error(`Failed to fetch helpful counts: ${error.message}`);
  }

  for (const row of data) {
    if (row.reaction_type === "helpful") {
      countsMap.set(row.interview_report_id, Number(row.cnt));
    }
  }

  return countsMap;
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
  configId: string,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<number> {
  const supabase = createAdminClient();
  const useInnerJoin = hasReportLevelFilters(filters);
  const selectQuery = useInnerJoin ? "*, interview_report!inner(*)" : "*";

  let query = supabase
    .from("interview_sessions")
    .select(selectQuery, { count: "exact", head: true })
    .eq("interview_config_id", configId);

  // ステータスフィルタ
  if (filters.status === "completed") {
    query = query.not("completed_at", "is", null);
  } else if (filters.status === "in_progress") {
    query = query.is("completed_at", null);
  }

  // レポートレベルフィルタ
  if (filters.visibility === "public") {
    query = query.eq("interview_report.is_public_by_admin", true);
  } else if (filters.visibility === "private") {
    query = query.eq("interview_report.is_public_by_admin", false);
  }

  if (filters.stance !== "all") {
    query = query.eq("interview_report.stance", filters.stance);
  }

  if (filters.role !== "all") {
    query = query.eq("interview_report.role", filters.role);
  }

  const { count, error } = await query;

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
