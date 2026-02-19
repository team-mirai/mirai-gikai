import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * レポートIDからインタビューレポートとセッション情報を結合取得
 */
export async function findReportWithSessionById(reportId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select(
      "*, interview_sessions(user_id, started_at, completed_at, is_public_by_user, interview_configs(bill_id))"
    )
    .eq("id", reportId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch interview report: ${error.message}`);
  }

  return data;
}

/**
 * セッションIDからインタビューレポートを取得
 */
export async function findReportBySessionId(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select("*")
    .eq("interview_session_id", sessionId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch interview report: ${error.message}`);
  }

  return data;
}

/**
 * セッションIDからインタビューメッセージ一覧を取得（作成日時昇順）
 */
export async function findMessagesBySessionId(sessionId: string) {
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

/**
 * 議案IDから議案情報を取得（bill_contentsを結合）
 */
export async function findBillWithContentById(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("id, name, thumbnail_url, bill_contents(title)")
    .eq("id", billId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }

  return data;
}

/**
 * セッションの公開設定を更新
 */
export async function updateSessionPublicSetting(
  sessionId: string,
  isPublic: boolean
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_sessions")
    .update({ is_public_by_user: isPublic })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to update public setting: ${error.message}`);
  }
}
