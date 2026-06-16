import { createAdminClient } from "@mirai-gikai/supabase";
import type { BackfillTargetReport } from "../shared/types";

// billId 指定時のみ議案で絞り込むための埋め込みリレーション付き select。
// interview_report → interview_sessions → interview_configs は全て NOT NULL の
// 1:1 関係なので、!inner を付けても件数には影響しない。billId 未指定（既定の
// ポーリング経路）では join を避けるため最小限の "id" / "id, interview_session_id"
// を使う。
const REPORT_SELECT_WITH_BILL =
  "id, interview_session_id, interview_sessions!inner(interview_configs!inner(bill_id))";
const BILL_FILTER = "interview_sessions.interview_configs.bill_id";

const toTargets = (
  rows: { id: string; interview_session_id: string }[]
): BackfillTargetReport[] =>
  rows.map((r) => ({ reportId: r.id, sessionId: r.interview_session_id }));

/** レポート件数を返す（pendingOnly=未再抽出のみ）。billId 指定時は当該議案に限定する。 */
async function countReports(
  billId: string | undefined,
  pendingOnly: boolean
): Promise<number> {
  const supabase = createAdminClient();
  let query = billId
    ? supabase
        .from("interview_report")
        .select(REPORT_SELECT_WITH_BILL, { count: "exact", head: true })
        .eq(BILL_FILTER, billId)
    : supabase
        .from("interview_report")
        .select("id", { count: "exact", head: true });
  if (pendingOnly) {
    query = query.is("opinions_reextracted_at", null);
  }
  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count reports: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * 未再抽出（opinions_reextracted_at IS NULL）のレポート件数を返す。
 * 進捗表示・チャンク連鎖の継続判定に使う。billId 指定時は当該議案に限定する。
 */
export function countPendingReextraction(billId?: string): Promise<number> {
  return countReports(billId, true);
}

/** interview_report の総件数（進捗の分母表示用）。billId 指定時は当該議案に限定する。 */
export function countAllReports(billId?: string): Promise<number> {
  return countReports(billId, false);
}

/**
 * 未再抽出レポートを公開同意優先・古い順で limit 件取得する。
 * billId 指定時は当該議案に限定する。
 */
export async function findReportsToReextract(
  limit: number,
  billId?: string
): Promise<BackfillTargetReport[]> {
  const supabase = createAdminClient();
  const base = billId
    ? supabase
        .from("interview_report")
        .select(REPORT_SELECT_WITH_BILL)
        .eq(BILL_FILTER, billId)
    : supabase.from("interview_report").select("id, interview_session_id");
  const { data, error } = await base
    .is("opinions_reextracted_at", null)
    .order("is_public_by_user", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch reports to reextract: ${error.message}`);
  }
  return toTargets(data ?? []);
}

/**
 * 指定議案の全レポートの再抽出ウォーターマーク（opinions_reextracted_at）を NULL に戻す。
 * scope="all"（既処理含む全件やり直し）の起点。これにより以後は未再抽出として扱われ、
 * pending 件数を進捗の分母にできる（再実行の早期完了表示を防ぐ）。リセット件数を返す。
 *
 * 1ページ取得→更新を繰り返す。更新で NOT NULL から外れた行は次ページに残らないため、
 * 全件を一度にメモリへ載せずに（大規模議案でもページサイズ分のみ）処理できる。
 */
export async function resetReextractionForBill(
  billId: string
): Promise<number> {
  const supabase = createAdminClient();
  const pageSize = 1000;
  let reset = 0;

  while (true) {
    // 未リセット（NOT NULL）の行を1ページ分だけ取得する。
    const { data, error } = await supabase
      .from("interview_report")
      .select(REPORT_SELECT_WITH_BILL)
      .eq(BILL_FILTER, billId)
      .not("opinions_reextracted_at", "is", null)
      .order("id", { ascending: true })
      .limit(pageSize);
    if (error) {
      throw new Error(`Failed to fetch reports to reset: ${error.message}`);
    }

    const ids = (data ?? []).map((r) => r.id);
    if (ids.length === 0) break;

    const { error: updateError } = await supabase
      .from("interview_report")
      .update({ opinions_reextracted_at: null })
      .in("id", ids);
    if (updateError) {
      throw new Error(
        `Failed to reset reextraction watermark: ${updateError.message}`
      );
    }
    reset += ids.length;

    if (ids.length < pageSize) break;
  }

  return reset;
}

/**
 * 再抽出を試行したが失敗したレポートに処理時刻だけ記録する。
 * 公開同意優先の並びで失敗レポートが先頭に滞留して前進が止まるのを防ぐため、
 * 失敗時もウォーターマークを進める（再実行時は当該行を NULL に戻す）。
 */
export async function markReextractionAttempted(
  reportId: string,
  reextractedAtIso: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_report")
    .update({ opinions_reextracted_at: reextractedAtIso })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Failed to mark reextraction attempted: ${error.message}`);
  }
}
