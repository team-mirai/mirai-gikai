import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/** 生のトピック行（フィルタ・整形前）。 */
export type RawAnalysisTopicRow = {
  id: string;
  title: string;
  description: string;
  parent_topic_id: string | null;
  topic_opinion: Array<{
    interview_opinion: {
      id: string;
      opinion_index: number;
      title: string;
      content: string;
      contextual_quote: string | null;
      bill_sentiment: string | null;
      richness: number | null;
      concern: string | null;
      proposal: string | null;
      reasoning_types: string[];
      interview_report: {
        role: string | null;
        role_title: string | null;
        is_public_by_admin: boolean;
        is_public_by_user: boolean;
        moderation_status: string | null;
      };
    } | null;
  }> | null;
};

/**
 * 指定 version のトピックと意見を、表示判定に必要な列込みで取得する。
 *
 * `is_public_by_admin` / `is_public_by_user` / `moderation_status` を必ず取る。
 * `topic_opinion` の割当は分析実行時点のスナップショットなので、その後に
 * 管理者が非公開化・ユーザーが同意撤回・モデレーションが ng になった意見も
 * 割当行としては残る。表示のたびに再判定しないと、撤回済みの発言が
 * 引用の導線に出続ける。
 *
 * 意見の並びは `opinion_index` で固定する。ネスト埋め込みは order を
 * 指定しないと順序が保証されず、同点ソートの安定性が崩れる。
 */
export async function findAnalysisTopics(
  versionId: string
): Promise<RawAnalysisTopicRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic")
    .select(
      `id, title, description, parent_topic_id,
       topic_opinion(
         interview_opinion(
           id, opinion_index, title, content, contextual_quote, bill_sentiment,
           richness, concern, proposal, reasoning_types,
           interview_report!inner(
             role, role_title,
             is_public_by_admin, is_public_by_user, moderation_status
           )
         )
       )`
    )
    .eq("version_id", versionId)
    .order("sort_order", { ascending: true })
    .order("opinion_index", {
      referencedTable: "topic_opinion.interview_opinion",
      ascending: true,
    });

  if (error) {
    throw new Error(`Failed to fetch analysis topics: ${error.message}`);
  }
  return (data ?? []) as unknown as RawAnalysisTopicRow[];
}
