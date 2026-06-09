import { createAdminClient } from "@mirai-gikai/supabase";
import type { BackfillTargetReport } from "../shared/types";

/**
 * 未再抽出（opinions_reextracted_at IS NULL）のレポート件数を返す。
 * 進捗表示・チャンク連鎖の継続判定に使う。
 */
export async function countPendingReextraction(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("interview_report")
    .select("id", { count: "exact", head: true })
    .is("opinions_reextracted_at", null);

  if (error) {
    throw new Error(`Failed to count pending reextraction: ${error.message}`);
  }
  return count ?? 0;
}

/** interview_report の総件数（進捗の分母表示用）。 */
export async function countAllReports(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("interview_report")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to count reports: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * 未再抽出レポートを公開同意優先・古い順で limit 件取得する。
 */
export async function findReportsToReextract(
  limit: number
): Promise<BackfillTargetReport[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select("id, interview_session_id")
    .is("opinions_reextracted_at", null)
    .order("is_public_by_user", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch reports to reextract: ${error.message}`);
  }
  return (data ?? []).map((r) => ({
    reportId: r.id,
    sessionId: r.interview_session_id,
  }));
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
