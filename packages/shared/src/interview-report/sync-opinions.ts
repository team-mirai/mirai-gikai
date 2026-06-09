import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewOpinionInsert } from "./build-opinion-rows";

/**
 * レポートの意見を interview_opinion（正規化プロジェクション）へ同期する。
 *
 * opinion_id(UUID) を安定させるため delete+insert ではなく
 * ON CONFLICT (interview_report_id, opinion_index) DO UPDATE で upsert する（§3.1）。
 * 意見数が減った再生成では、新配列長以降の opinion_index を持つ行のみ削除する。
 *
 * web のインタビュー完了時 dual-write と admin の再抽出バックフィルで共通利用する。
 */
export async function syncInterviewOpinions(
  reportId: string,
  rows: InterviewOpinionInsert[]
): Promise<void> {
  const supabase = createAdminClient();

  if (rows.length > 0) {
    const { error } = await supabase
      .from("interview_opinion")
      .upsert(rows, { onConflict: "interview_report_id,opinion_index" });
    if (error) {
      throw new Error(`Failed to upsert interview opinions: ${error.message}`);
    }
  }

  // 意見数が縮んだ（または0になった）場合に末尾の古い行を削除
  const { error: deleteError } = await supabase
    .from("interview_opinion")
    .delete()
    .eq("interview_report_id", reportId)
    .gte("opinion_index", rows.length);
  if (deleteError) {
    throw new Error(
      `Failed to prune stale interview opinions: ${deleteError.message}`
    );
  }
}
