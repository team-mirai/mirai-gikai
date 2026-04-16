import "server-only";

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

  await query;
}

export async function createInterviewConfigRecord(params: {
  bill_id: string;
  name: string;
  status: "public" | "closed";
  mode: "loop" | "bulk";
  themes: string[] | null;
  knowledge_source: string | null;
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
    mode: "loop" | "bulk";
    themes: string[] | null;
    knowledge_source: string | null;
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

export async function countAllSessionsByConfigId(): Promise<
  Record<string, number>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("interview_config_id");

  if (error) {
    throw new Error(`Failed to count sessions: ${error.message}`);
  }

  const result: Record<string, number> = {};
  for (const row of data) {
    result[row.interview_config_id] =
      (result[row.interview_config_id] ?? 0) + 1;
  }
  return result;
}

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
