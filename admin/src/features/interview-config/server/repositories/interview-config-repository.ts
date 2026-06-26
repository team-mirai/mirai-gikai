import "server-only";

import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewConfig, InterviewQuestion } from "../../shared/types";

export type InterviewConfigWithBill = InterviewConfig & {
  bill: { id: string; name: string };
};

export async function findAllInterviewConfigs(): Promise<
  InterviewConfigWithBill[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("*, bill:bills!inner(id, name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch interview configs: ${error.message}`);
  }

  return data as InterviewConfigWithBill[];
}

export async function findInterviewConfigsByBillId(
  billId: string
): Promise<InterviewConfig[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("*")
    .eq("bill_id", billId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch interview configs: ${error.message}`);
  }

  return data;
}

export async function findInterviewConfigById(
  configId: string
): Promise<InterviewConfig | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("*")
    .eq("id", configId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch interview config: ${error.message}`);
  }

  return data;
}

export async function findInterviewConfigBillId(
  configId: string
): Promise<{ bill_id: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("bill_id")
    .eq("id", configId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch interview config: ${error.message}`);
  }

  return data;
}

export async function findInterviewQuestionsByConfigId(
  interviewConfigId: string
): Promise<InterviewQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("interview_config_id", interviewConfigId)
    .order("question_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch interview questions: ${error.message}`);
  }

  return data;
}

export async function closeOtherPublicConfigs(
  billId: string,
  excludeConfigId?: string
): Promise<void> {
  const supabase = createAdminClient();
  const query = supabase
    .from("interview_configs")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("bill_id", billId)
    .eq("status", "public");

  if (excludeConfigId) {
    query.neq("id", excludeConfigId);
  }

  const { error } = await query;
  if (error) {
    throw new Error(`Failed to close interview configs: ${error.message}`);
  }
}

export async function createInterviewConfigRecord(params: {
  bill_id: string;
  name: string;
  status: "public" | "closed";
  mode: InterviewMode;
  themes: string[] | null;
  chat_model: string | null;
  estimated_duration: number | null;
}): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .insert(params)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create interview config: ${error.message}`);
  }

  return data;
}

export async function updateInterviewConfigRecord(
  configId: string,
  params: {
    name: string;
    status: "public" | "closed";
    mode: InterviewMode;
    themes: string[] | null;
    chat_model: string | null;
    estimated_duration: number | null;
    updated_at: string;
  }
): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .update(params)
    .eq("id", configId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update interview config: ${error.message}`);
  }

  return data;
}

export async function countSessionsByConfigIds(
  configIds: string[]
): Promise<Record<string, number>> {
  if (configIds.length === 0) return {};

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("count_sessions_by_config_ids", {
    p_config_ids: configIds,
  });

  if (error) {
    throw new Error(`Failed to count sessions: ${error.message}`);
  }

  const result: Record<string, number> = {};
  for (const configId of configIds) {
    result[configId] = 0;
  }
  for (const row of data) {
    result[row.interview_config_id] = Number(row.session_count);
  }
  return result;
}

/**
 * インタビュー設定を物理削除する
 * 複製時のロールバックなど、作成直後のレコードを完全に取り消す用途で使用する
 */
export async function deleteInterviewConfigRecord(
  configId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_configs")
    .delete()
    .eq("id", configId);

  if (error) {
    throw new Error(`Failed to delete interview config: ${error.message}`);
  }
}

/**
 * インタビュー設定を論理削除する（deleted_atを設定）
 * 紐づく質問・セッション・レポートは保持され、一覧・公開取得から除外される。
 * 同時に status を closed にし、status="public" を見る公開判定
 * （法案一覧の「AIインタビュー受付中」バッジ等）からも除外されるようにする。
 */
export async function softDeleteInterviewConfigRecord(
  configId: string
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("interview_configs")
    .update({ deleted_at: now, status: "closed", updated_at: now })
    .eq("id", configId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Failed to delete interview config: ${error.message}`);
  }
}

/**
 * 論理削除した設定に紐づくレポートを公開停止する（is_public_by_admin=false）。
 * 公開レポートの全取得経路（個別ページ・公開一覧・各 RPC）が
 * is_public_by_admin=true でゲートしているため、これにより一括で公開対象から除外される。
 *
 * セッション数が PostgREST の行数上限（既定1000件）を超える設定でも漏れなく
 * 更新できるよう、DB側の UPDATE で一括処理する RPC を利用する。
 */
export async function unpublishReportsByConfigId(
  configId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("unpublish_reports_by_config_id", {
    p_config_id: configId,
  });

  if (error) {
    throw new Error(`Failed to unpublish reports: ${error.message}`);
  }
}

export async function createInterviewQuestions(
  questions: {
    interview_config_id: string;
    question: string;
    follow_up_guide: string | null;
    quick_replies: string[] | null;
    question_order: number;
  }[]
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_questions")
    .insert(questions);

  if (error) {
    throw new Error(`Failed to create interview questions: ${error.message}`);
  }
}

export async function deleteInterviewQuestionsByConfigId(
  interviewConfigId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_questions")
    .delete()
    .eq("interview_config_id", interviewConfigId);

  if (error) {
    throw new Error(`Failed to delete interview questions: ${error.message}`);
  }
}
