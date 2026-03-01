import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { ReactionCounts, ReactionType } from "../../shared/types";

/**
 * レポートが公開されているか確認する
 * リアクションは公開レポートにのみ許可
 */
export async function isReportPublic(reportId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select("interview_sessions!inner(is_public_by_user)")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return false;
  }

  const session = data.interview_sessions as unknown as {
    is_public_by_user: boolean;
  };
  return session.is_public_by_user;
}

/**
 * レポートIDからリアクション数を集計して返す
 */
export async function findReactionCountsByReportId(
  reportId: string
): Promise<ReactionCounts> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("report_reactions")
    .select("reaction_type")
    .eq("interview_report_id", reportId);

  if (error) {
    throw new Error(`Failed to fetch reaction counts: ${error.message}`);
  }

  const counts: ReactionCounts = { helpful: 0, hmm: 0 };
  for (const row of data) {
    const type = row.reaction_type as ReactionType;
    if (type in counts) {
      counts[type]++;
    }
  }
  return counts;
}

/**
 * ユーザーの現在のリアクションを取得
 */
export async function findUserReaction(
  reportId: string,
  userId: string
): Promise<ReactionType | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("report_reactions")
    .select("reaction_type")
    .eq("interview_report_id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user reaction: ${error.message}`);
  }

  return data ? (data.reaction_type as ReactionType) : null;
}

/**
 * リアクションをupsert（なければ挿入、あれば更新）
 */
export async function upsertReaction(
  reportId: string,
  userId: string,
  reactionType: ReactionType
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("report_reactions").upsert(
    {
      interview_report_id: reportId,
      user_id: userId,
      reaction_type: reactionType,
    },
    { onConflict: "interview_report_id,user_id" }
  );

  if (error) {
    throw new Error(`Failed to upsert reaction: ${error.message}`);
  }
}

/**
 * リアクションを削除
 */
export async function deleteReaction(
  reportId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("report_reactions")
    .delete()
    .eq("interview_report_id", reportId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete reaction: ${error.message}`);
  }
}
