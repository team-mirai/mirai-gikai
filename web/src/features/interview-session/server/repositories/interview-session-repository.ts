import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  InterviewMessage,
  InterviewReport,
  InterviewReportInsert,
  InterviewSession,
} from "../../shared/types";

// ========================================
// Interview Sessions
// ========================================

/**
 * アクティブ（未完了・未アーカイブ）なインタビューセッションを取得
 */
export async function findActiveInterviewSession(
  interviewConfigId: string,
  userId: string
): Promise<InterviewSession | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("interview_config_id", interviewConfigId)
    .eq("user_id", userId)
    .is("completed_at", null)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch active interview session: ${error.message}`
    );
  }

  return data;
}

/**
 * セッションIDからインタビューセッション（interview_configs付き）を取得
 */
export async function findInterviewSessionWithConfigById(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*, interview_configs(bill_id)")
    .eq("id", sessionId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch interview session: ${error.message}`);
  }

  return data;
}

/**
 * 最新の未アーカイブセッション（完了済みも含む）を取得
 */
export async function findLatestNonArchivedSession(
  interviewConfigId: string,
  userId: string
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, completed_at, interview_report(id)")
    .eq("interview_config_id", interviewConfigId)
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch latest interview session: ${error.message}`
    );
  }

  return data;
}

/**
 * セッションの所有者情報（user_id）を取得
 */
export async function findSessionOwnerById(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("user_id")
    .eq("id", sessionId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch session owner: ${error.message}`);
  }

  return data;
}

/**
 * 新しいインタビューセッションを作成
 */
export async function createInterviewSessionRecord(params: {
  interviewConfigId: string;
  userId: string;
}): Promise<InterviewSession> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      interview_config_id: params.interviewConfigId,
      user_id: params.userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create interview session: ${error.message}`);
  }

  return data;
}

/**
 * セッションをアーカイブ
 */
export async function updateInterviewSessionArchived(
  sessionId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_sessions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to archive interview session: ${error.message}`);
  }
}

/**
 * セッションを完了
 */
export async function updateInterviewSessionCompleted(
  sessionId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to complete interview session: ${error.message}`);
  }
}

// ========================================
// Interview Messages
// ========================================

/**
 * セッションのメッセージを時系列順で取得
 */
export async function findInterviewMessagesBySessionId(
  sessionId: string
): Promise<InterviewMessage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", sessionId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch interview messages: ${error.message}`);
  }

  return data || [];
}

/**
 * セッションのメッセージを新しい順で取得
 */
export async function findInterviewMessagesBySessionIdDesc(
  sessionId: string
): Promise<InterviewMessage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", sessionId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch interview messages: ${error.message}`);
  }

  return data || [];
}

/**
 * インタビューメッセージを保存
 */
export async function createInterviewMessage(params: {
  sessionId: string;
  role: "assistant" | "user";
  content: string;
}): Promise<InterviewMessage> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .insert({
      interview_session_id: params.sessionId,
      role: params.role,
      content: params.content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save interview message: ${error.message}`);
  }

  return data;
}

// ========================================
// Interview Session Ratings
// ========================================

/**
 * セッション評価（星1〜5）を保存（1セッション1評価、既存があれば無視）
 */
export async function createInterviewSessionRating(params: {
  sessionId: string;
  rating: number;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("interview_session_ratings").upsert(
    {
      interview_session_id: params.sessionId,
      rating: params.rating,
    },
    { onConflict: "interview_session_id", ignoreDuplicates: true }
  );

  if (error) {
    throw new Error(
      `Failed to save interview session rating: ${error.message}`
    );
  }
}

// ========================================
// Interview Reports
// ========================================

/**
 * インタビューレポートをUPSERT
 */
export async function upsertInterviewReport(
  params: InterviewReportInsert
): Promise<InterviewReport> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .upsert(params, { onConflict: "interview_session_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save interview report: ${error.message}`);
  }

  return data;
}
