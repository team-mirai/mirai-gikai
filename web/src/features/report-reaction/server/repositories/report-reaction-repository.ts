import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { ReactionCounts, ReactionType } from "../../shared/types";

/**
 * レポートが公開されているか確認する
 * ユーザー公開設定(is_public_by_user)と管理者公開設定(is_public_by_admin)の両方がtrueの場合のみ公開
 */
export async function isReportPublic(reportId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select("is_public_by_admin, is_public_by_user")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.is_public_by_admin && data.is_public_by_user;
}

/**
 * レポートIDからリアクション数をSQL COUNTで集計して返す
 */
export async function findReactionCountsByReportId(
  reportId: string
): Promise<ReactionCounts> {
  const supabase = createAdminClient();
  const [helpfulResult, hmmResult] = await Promise.all([
    supabase
      .from("report_reactions")
      .select("*", { count: "exact", head: true })
      .eq("interview_report_id", reportId)
      .eq("reaction_type", "helpful"),
    supabase
      .from("report_reactions")
      .select("*", { count: "exact", head: true })
      .eq("interview_report_id", reportId)
      .eq("reaction_type", "hmm"),
  ]);

  if (helpfulResult.error) {
    throw new Error(
      `Failed to fetch helpful count: ${helpfulResult.error.message}`
    );
  }
  if (hmmResult.error) {
    throw new Error(`Failed to fetch hmm count: ${hmmResult.error.message}`);
  }

  return {
    helpful: helpfulResult.count ?? 0,
    hmm: hmmResult.count ?? 0,
  };
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

/**
 * 複数レポートのリアクション数をDB側で集約して一括取得
 * RPC関数でGROUP BY集計を行い、転送量を最小化する
 */
export async function findReactionCountsByReportIds(
  reportIds: string[]
): Promise<Map<string, ReactionCounts>> {
  const countsMap = new Map<string, ReactionCounts>();
  if (reportIds.length === 0) return countsMap;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("count_reactions_by_report_ids", {
    report_ids: reportIds,
  });

  if (error) {
    throw new Error(`Failed to fetch reaction counts: ${error.message}`);
  }

  for (const row of data) {
    const counts = countsMap.get(row.interview_report_id) ?? {
      helpful: 0,
      hmm: 0,
    };
    counts[row.reaction_type as ReactionType] = Number(row.cnt);
    countsMap.set(row.interview_report_id, counts);
  }

  return countsMap;
}

/**
 * 複数レポートに対するユーザーのリアクションを一括取得
 */
export async function findUserReactionsByReportIds(
  reportIds: string[],
  userId: string
): Promise<Map<string, ReactionType>> {
  const reactionsMap = new Map<string, ReactionType>();
  if (reportIds.length === 0) return reactionsMap;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("report_reactions")
    .select("interview_report_id, reaction_type")
    .in("interview_report_id", reportIds)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch user reactions: ${error.message}`);
  }

  for (const row of data) {
    reactionsMap.set(
      row.interview_report_id,
      row.reaction_type as ReactionType
    );
  }

  return reactionsMap;
}
