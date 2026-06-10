import type {
  PublicOpinion,
  PublicTopic,
  PublicTopicAnalysis,
  PublishedVersionMeta,
  RawOpinionRow,
  RawTopicRow,
  UserCategory,
} from "../types";

/** interview_report.role → §9 の4区分。未知/null は一般市民に倒す。 */
export function mapRoleToCategory(role: string | null): UserCategory {
  switch (role) {
    case "daily_life_affected":
      return "affected";
    case "work_related":
      return "industry";
    case "subject_expert":
      return "expert";
    default:
      // general_citizen / null / 未知の値
      return "citizen";
  }
}

/**
 * §8 表示時フィルタの最終ゲート: 公開同意済み × モデレーションOK のみ通す。
 * 分析後に同意撤回・非公開化された意見は即座に除外される。
 */
function isDisplayable(o: RawOpinionRow): boolean {
  return o.is_public_by_user === true && o.moderation_status === "ok";
}

function toBillSentiment(value: string | null): "期待" | "懸念" | null {
  return value === "期待" || value === "懸念" ? value : null;
}

/**
 * 公開中 version の生データ（§8 未フィルタ）から、表示用レスポンス（§13 A.4）を構築する純粋関数。
 *
 * - 各意見を §8（is_public_by_user × moderation_status='ok'）でフィルタ。
 * - 件数・属性内訳・期待/懸念は **フィルタ後の集合から再計算**（保存値は使わない・§8）。
 * - フィルタ後に意見が0件になったトピックは応答に含めない。
 * - 未分類（topic 未割当）の意見はそもそも topic 配下に無いため自然に除外される（§9）。
 * - total_opinions はフィルタ後・トピック割当済みの意見総数。
 */
export function buildPublicTopicAnalysis(
  meta: PublishedVersionMeta,
  rawTopics: RawTopicRow[]
): PublicTopicAnalysis {
  const topics: PublicTopic[] = [];
  let totalOpinions = 0;

  for (const rawTopic of rawTopics) {
    const displayable = rawTopic.opinions.filter(isDisplayable);
    if (displayable.length === 0) {
      // フィルタで全件消えたトピックはカードを作らない（§8/§9）
      continue;
    }

    const counts = { affected: 0, industry: 0, expert: 0, citizen: 0 };
    const sentiment = { 期待: 0, 懸念: 0 };
    const opinions: PublicOpinion[] = displayable.map((o) => {
      const category = mapRoleToCategory(o.role);
      counts[category] += 1;
      const billSentiment = toBillSentiment(o.bill_sentiment);
      if (billSentiment) sentiment[billSentiment] += 1;
      return {
        id: o.id,
        title: o.title,
        content: o.content,
        user_category: category,
        bill_sentiment: billSentiment,
        contextual_quote: o.contextual_quote,
        question_snippet: null,
      };
    });

    totalOpinions += displayable.length;
    topics.push({
      id: rawTopic.id,
      title: rawTopic.title,
      description: rawTopic.description,
      opinion_count: displayable.length,
      affected_count: counts.affected,
      industry_count: counts.industry,
      expert_count: counts.expert,
      citizen_count: counts.citizen,
      sentiment,
      opinions,
    });
  }

  return {
    bill_id: meta.bill_id,
    version: meta.version,
    generated_at: meta.generated_at,
    total_opinions: totalOpinions,
    topics,
  };
}
