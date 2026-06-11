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
 * 指定議案の全レポート ID を、再抽出済み有無にかかわらず取得する。
 * scope="all" のウォーターマークリセット対象を集めるのに使う。
 * 1000 件超でも取りこぼさないようページングする。
 */
export async function findAllReportsForBill(
  billId: string
): Promise<BackfillTargetReport[]> {
  const supabase = createAdminClient();
  const pageSize = 1000;
  const all: BackfillTargetReport[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("interview_report")
      .select(REPORT_SELECT_WITH_BILL)
      .eq(BILL_FILTER, billId)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch reports for bill: ${error.message}`);
    }
    const rows = data ?? [];
    all.push(...toTargets(rows));
    if (rows.length < pageSize) break;
  }

  return all;
}

/**
 * 指定議案の全レポートの再抽出ウォーターマーク（opinions_reextracted_at）を NULL に戻す。
 * scope="all"（既処理含む全件やり直し）の起点。これにより以後は未再抽出として扱われ、
 * pending 件数を進捗の分母にできる（再実行の早期完了表示を防ぐ）。リセット件数を返す。
 */
export async function resetReextractionForBill(
  billId: string
): Promise<number> {
  const targets = await findAllReportsForBill(billId);
  const supabase = createAdminClient();
  // .in() の URL 長対策でチャンク更新する。
  const chunkSize = 200;
  let reset = 0;

  for (let i = 0; i < targets.length; i += chunkSize) {
    const ids = targets.slice(i, i + chunkSize).map((t) => t.reportId);
    const { error } = await supabase
      .from("interview_report")
      .update({ opinions_reextracted_at: null })
      .in("id", ids);
    if (error) {
      throw new Error(
        `Failed to reset reextraction watermark: ${error.message}`
      );
    }
    reset += ids.length;
  }

  return reset;
}

/**
 * 再抽出した意見でレポートを更新し、処理時刻を記録する（成功時）。
 * opinions 以外のカラム（summary/stance/role/richness/moderation/公開フラグ）は変更しない。
 */
export async function updateReportOpinions(
  reportId: string,
  opinions: unknown,
  reextractedAtIso: string
): Promise<void> {
  const supabase = createAdminClient();
  // opinions は呼び出し側で enrich 済みの配列。JSONB カラムの厳密型を満たすため as never でキャスト。
  const { error } = await supabase
    .from("interview_report")
    .update({
      opinions: opinions as never,
      opinions_reextracted_at: reextractedAtIso,
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Failed to update report opinions: ${error.message}`);
  }
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
