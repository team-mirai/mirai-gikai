import "server-only";

import { generateObject } from "ai";
import { TOPIC_ANALYSIS_MODEL } from "../../shared/constants";
import { topicMergeSchema } from "../../shared/schemas";

/**
 * Step 2: 類似トピックをマージする
 *
 * Step 1 で抽出された重複・類似トピックを統合し、
 * 最終的なトピック名一覧を返す
 */
export async function mergeTopics(
  rawTopics: string[],
  billTitle: string
): Promise<string[]> {
  const topicsList = rawTopics.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const { object } = await generateObject({
    model: TOPIC_ANALYSIS_MODEL,
    schema: topicMergeSchema,
    prompt: `あなたは日本の法案に関する市民意見のトピック整理を行います。

## 法案
${billTitle}

## タスク
以下のトピック一覧には重複・類似するものが含まれています。
意味が近いトピックをマージし、整理された最終トピック一覧を作成してください。

### ルール
- 意味が十分に近いトピックのみマージしてください
- マージ後のトピック名は、元のトピックの内容を包括する表現にしてください
- マージ元のトピック名を original_names に列挙してください
- マージ不要なトピックは、そのまま1つだけ original_names に含めてください
- 最終的なトピック数は5〜20程度を目安にしてください

## トピック一覧
${topicsList}`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "topic-analysis-step2-merge",
      metadata: {
        rawTopicsCount: String(rawTopics.length),
      },
    },
  });

  return object.merged_topics.map((t) => t.name);
}
