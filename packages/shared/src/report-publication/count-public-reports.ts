import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * 議案の公開レポート件数を数える（公開 = is_public_by_admin × is_public_by_user）。
 * 一覧の回答数バッジ、オープンデータAPIの配布下限判定などに使う共通関数。
 *
 * 公開の定義（管理者公開×ユーザー同意）を1箇所に持つため、各所がこれを共有する。
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

/**
 * 複数議案の公開レポート件数をまとめて数える。
 *
 * 一覧で議案ごとにバッジを出すため、countPublicReportsByBillId を議案数ぶん
 * 呼ぶと数十回のクエリになる。集約はDB側（count_public_reports_by_bill_ids）で行う。
 *
 * 0件の議案は返り値に現れないので、呼び出し側で 0 として扱えるよう Map で返す。
 */
export async function countPublicReportsByBillIds(
  billIds: readonly string[]
): Promise<Map<string, number>> {
  if (billIds.length === 0) return new Map();

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "count_public_reports_by_bill_ids",
    { p_bill_ids: [...billIds] }
  );

  if (error) {
    throw new Error(
      `Failed to count public interview reports by bill ids: ${error.message}`
    );
  }

  return new Map(
    (data ?? []).map((row) => [row.bill_id, Number(row.report_count)])
  );
}
