import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * 議案の公開レポート件数を数える（公開 = is_public_by_admin × is_public_by_user）。
 * k-匿名性しきい値（[[shouldDisplayPublicReports]]）の判定や公開ページの表示制御に使う共通関数。
 *
 * web の公開ページ・OG画像・リアクション、admin MCP の回答詳細ゲートが同一定義を共有する。
 */
export async function countPublicReportsByBillId(
  billId: string
): Promise<number> {
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
    throw new Error(`Failed to count public interview reports: ${error.message}`);
  }

  return count ?? 0;
}
