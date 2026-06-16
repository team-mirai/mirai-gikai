import type { PublicOpinion, PublicTopic, UserCategory } from "../types";

/** トピック一覧のフィルタ種別。all は全件（API のキュレーション順）。 */
export type TopicFilter = UserCategory | "期待" | "懸念" | "all";

/** フィルタchipの表示種別（all を除く）。 */
export type TopicFilterChip = Exclude<TopicFilter, "all">;

/**
 * フィルタchipの表示順とラベル。
 * 順序は 期待 → 懸念 → 当事者 → 事業者 → 専門家 → 一般市民。
 */
export const topicFilterOptions: { value: TopicFilterChip; label: string }[] = [
  { value: "期待", label: "期待" },
  { value: "懸念", label: "懸念" },
  { value: "affected", label: "当事者" },
  { value: "industry", label: "事業者" },
  { value: "expert", label: "専門家" },
  { value: "citizen", label: "市民" },
];

/** 有効な全フィルタ値（URL クエリのバリデーション用）。 */
const ALL_TOPIC_FILTERS: TopicFilter[] = [
  "all",
  ...topicFilterOptions.map((o) => o.value),
];

/** URL クエリ等の文字列を TopicFilter に正規化する。不正値は all。 */
export function parseTopicFilter(
  value: string | null | undefined
): TopicFilter {
  return ALL_TOPIC_FILTERS.includes(value as TopicFilter)
    ? (value as TopicFilter)
    : "all";
}

/** フィルタの短いラベル（例: 「事業者」）。all のときは null。 */
export function topicFilterLabel(filter: TopicFilter): string | null {
  if (filter === "all") return null;
  return topicFilterOptions.find((o) => o.value === filter)?.label ?? null;
}

/** フィルタ適用時のソート順ラベル（例: 「事業者が多い順」）。all のときは null。 */
export function topicSortLabel(filter: TopicFilter): string | null {
  if (filter === "all") return null;
  const option = topicFilterOptions.find((o) => o.value === filter);
  return option ? `${option.label}が多い順` : null;
}

/** トピックから、指定フィルタ次元の件数を取り出す。 */
function countFor(topic: PublicTopic, filter: TopicFilterChip): number {
  switch (filter) {
    case "affected":
      return topic.affected_count;
    case "industry":
      return topic.industry_count;
    case "expert":
      return topic.expert_count;
    case "citizen":
      return topic.citizen_count;
    case "期待":
      return topic.sentiment.期待;
    case "懸念":
      return topic.sentiment.懸念;
  }
}

/**
 * フィルタを適用してトピックを並べ替える純粋関数。
 *
 * - "all": API のキュレーション順（sort_order）をそのまま維持する。
 * - カテゴリ / 期待 / 懸念: その次元の件数が 1 以上のトピックのみを残し、
 *   件数の降順で並べ替える。件数が同数の場合は元の順序を保つ（安定ソート）。
 */
export function filterAndSortTopics(
  topics: PublicTopic[],
  filter: TopicFilter
): PublicTopic[] {
  if (filter === "all") return topics;

  return topics
    .map((topic, index) => ({ topic, index, count: countFor(topic, filter) }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map((entry) => entry.topic);
}

/**
 * user_category / bill_sentiment を持つ要素を、指定フィルタ次元で絞り込む純粋関数。
 * "all" は全件。カテゴリは user_category、期待/懸念は bill_sentiment で一致判定する。
 * 意見（PublicOpinion）と回答者（PublicRespondent）で共通利用する。
 */
export function filterByAttributes<
  T extends {
    user_category: UserCategory;
    bill_sentiment: "期待" | "懸念" | null;
  },
>(items: T[], filter: TopicFilter): T[] {
  switch (filter) {
    case "all":
      return items;
    case "期待":
    case "懸念":
      return items.filter((i) => i.bill_sentiment === filter);
    default:
      return items.filter((i) => i.user_category === filter);
  }
}

/**
 * トピック詳細の意見一覧を、指定フィルタ次元で絞り込む純粋関数。
 * "all" は全件。カテゴリは user_category、期待/懸念は bill_sentiment で一致判定する。
 */
export function filterOpinions(
  opinions: PublicOpinion[],
  filter: TopicFilter
): PublicOpinion[] {
  return filterByAttributes(opinions, filter);
}
