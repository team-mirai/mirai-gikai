import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * bill_idから公開ステータスのインタビュー設定を取得
 */
export async function findPublicInterviewConfigByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("*")
    .eq("bill_id", billId)
    .eq("status", "public")
    .single();

  return { data, error };
}

/**
 * bill_idから最新のインタビュー設定を取得（ステータス問わず）
 */
export async function findLatestInterviewConfigByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("*")
    .eq("bill_id", billId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  return { data, error };
}

/**
 * interview_config_idからインタビュー質問一覧を取得（question_order昇順）
 */
export async function findInterviewQuestionsByConfigId(
  interviewConfigId: string
) {
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
