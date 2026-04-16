import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * interview_report を id で 1 件取得する。
 * 既存の interview-report-repository は session_id ベースなので、
 * シミュレーション機能用にレポート ID 直接アクセスを提供する。
 */
export async function findInterviewReportById(reportId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch interview report: ${error.message}`);
  }

  return data;
}
