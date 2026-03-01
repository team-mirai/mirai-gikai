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
      "*, interview_sessions(user_id, started_at, completed_at, interview_configs(bill_id))"
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
 * 議案IDから公開インタビューレポートを取得（total_score降順、件数制限あり）
 * 公開条件: is_public_by_admin = true AND is_public_by_user = true
 */
export async function findPublicReportsByBillId(
  billId: string,
  limit: number = 3
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select(
      "id, stance, role, role_title, summary, total_score, created_at, interview_sessions!inner(interview_configs!inner(bill_id))"
    )
    .eq("is_public_by_admin", true)
    .eq("is_public_by_user", true)
    .eq("interview_sessions.interview_configs.bill_id", billId)
    .order("total_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Failed to fetch public interview reports: ${error.message}`
    );
  }

  return data;
}

/**
 * 議案IDの公開インタビューレポート件数を取得
 */
export async function countPublicReportsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("interview_report")
    .select("id, interview_sessions!inner(interview_configs!inner(bill_id))", {
      count: "exact",
      head: true,
    })
    .eq("is_public_by_admin", true)
    .eq("is_public_by_user", true)
    .eq("interview_sessions.interview_configs.bill_id", billId);

  if (error) {
    throw new Error(
      `Failed to count public interview reports: ${error.message}`
    );
  }

  return count ?? 0;
}

/**
 * 公開レポートをIDから取得（認証不要）
 * 公開条件: is_public_by_admin = true AND is_public_by_user = true
 */
export async function findPublicReportWithSessionById(reportId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select(
      "*, interview_sessions(started_at, completed_at, interview_configs(bill_id))"
    )
    .eq("id", reportId)
    .eq("is_public_by_admin", true)
    .eq("is_public_by_user", true)
    .single();

  if (error) {
    throw new Error(
      `Failed to fetch public interview report: ${error.message}`
    );
  }

  return data;
}

/**
 * レポートの公開設定を更新
 */
export async function updateReportPublicSetting(
  reportId: string,
  isPublic: boolean
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_report")
    .update({ is_public_by_user: isPublic })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Failed to update public setting: ${error.message}`);
  }
}
