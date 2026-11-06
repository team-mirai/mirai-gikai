import { generateObject } from "ai";
import { GROUPING_MAX_MEDIUM_TOPICS, TOPIC_MODEL } from "../shared/constants";
import { topicGroupingSchema } from "../shared/schemas";
import type { BillContext, FinalTopicWithId } from "../shared/types";
import {
  type BigTopicDraft,
  buildTopicHierarchy,
  OTHER_BIG_TOPIC_TITLE,
  type TopicHierarchy,
} from "../utils/build-topic-hierarchy";
import { withRetry } from "../utils/concurrency";
import { joinSummaryPoints } from "../utils/join-summary-points";
import { toInlineText } from "../utils/to-inline-text";
import { buildGroupTopicsPrompt } from "./prompts";

/**
 * 中トピックを大トピックへ束ねる（2階層化）。
 *
 * **失敗しても投げない。** グルーピングは extract → merge → assign を全部終えた
 * 最後の工程で、しかも表示の畳み方でしかない。ここで throw すると先行工程の
 * LLM コストを払った version がまるごと failed になる。取れなかったときは
 * 親行を作らないフラット1階層に倒して保存まで通す（2階層化前と同じ見え方になる）。
 */
export async function groupTopics(
  mediumTopics: FinalTopicWithId[],
  bill: BillContext,
  /** 中トピックごとの意見件数。打ち切るときに件数の多いものを残すのに使う。 */
  countByLocalId: ReadonlyMap<string, number> = new Map()
): Promise<TopicHierarchy[]> {
  if (mediumTopics.length === 0) return [];

  // 1件に階層を被せても情報が増えない。親を作らずフラットに返す。
  if (mediumTopics.length === 1) {
    return [{ big: null, children: mediumTopics, isOther: false }];
  }

  // 中トピックが多すぎるとプロンプトが膨らみ、グルーピングの質も落ちる。
  // 件数の多いものから上限までをグルーピング対象にし、残りは「その他の論点」へ落とす。
  const byCountDesc = [...mediumTopics].sort(
    (a, b) =>
      (countByLocalId.get(b.local_id) ?? 0) -
      (countByLocalId.get(a.local_id) ?? 0)
  );
  const targets = byCountDesc.slice(0, GROUPING_MAX_MEDIUM_TOPICS);
  if (targets.length < mediumTopics.length) {
    console.warn(
      `[topic-analysis] grouping: ${mediumTopics.length} medium topics exceeds ${GROUPING_MAX_MEDIUM_TOPICS}; grouping the top ${targets.length} by opinion count and putting the rest under "${OTHER_BIG_TOPIC_TITLE}"`
    );
  }

  const mediumTopicsText = targets
    .map((t) => `${t.local_id}: ${t.title} — ${toInlineText(t.description)}`)
    .join("\n");

  let bigTopics: BigTopicDraft[] = [];
  try {
    const { object } = await withRetry(
      () =>
        generateObject({
          model: TOPIC_MODEL,
          schema: topicGroupingSchema,
          prompt: buildGroupTopicsPrompt(bill, mediumTopicsText),
          experimental_telemetry: {
            isEnabled: true,
            functionId: "user-topic-analysis-group",
          },
        }),
      "group"
    );
    bigTopics = object.big_topics.map((b) => ({
      title: b.title,
      description: joinSummaryPoints(b.description_points),
      member_local_ids: b.member_local_ids,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(
      `[topic-analysis] grouping failed, falling back to a flat hierarchy: ${message}`
    );
    bigTopics = [];
  }

  // 大トピックが対象と同数なら畳めていない（1対1の退化）。階層を被せない。
  if (bigTopics.length >= targets.length) {
    console.warn(
      `[topic-analysis] grouping produced ${bigTopics.length} big topics for ${targets.length} medium topics; falling back to a flat hierarchy`
    );
    bigTopics = [];
  }

  // LLM は「全中トピックをちょうど1つに」を守らないことがあるので機械的に閉じる。
  // bigTopics が空なら親行を作らないフラット1階層に倒れる。
  return buildTopicHierarchy(bigTopics, mediumTopics);
}
