import type { PublicTopic } from "../types";

export type TopicLocation = {
  topic: PublicTopic;
  /** 1始まりの表示順（例: 1/66 の 1）。 */
  position: number;
  total: number;
  prevTopicId: string | null;
  nextTopicId: string | null;
};

/**
 * トピック一覧から指定IDのトピックを探し、表示順と前後トピックIDを返す純粋関数。
 * 見つからなければ null。
 */
export function locateTopic(
  topics: PublicTopic[],
  topicId: string
): TopicLocation | null {
  const index = topics.findIndex((t) => t.id === topicId);
  if (index === -1) return null;

  return {
    topic: topics[index],
    position: index + 1,
    total: topics.length,
    prevTopicId: index > 0 ? topics[index - 1].id : null,
    nextTopicId: index < topics.length - 1 ? topics[index + 1].id : null,
  };
}
