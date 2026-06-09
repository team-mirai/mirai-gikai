import { generateObject } from "ai";
import { TOPIC_MODEL } from "../shared/constants";
import { topicMergeSchema } from "../shared/schemas";
import type { BillContext, TopicDraft } from "../shared/types";
import { withRetry } from "../utils/concurrency";
import { buildMergePrompt } from "./prompts";

/** Phase2: トピック候補を単一マージコールで統合（Reduce・§4.2）。 */
export async function mergeTopics(
  candidates: TopicDraft[],
  bill: BillContext
): Promise<TopicDraft[]> {
  if (candidates.length === 0) return [];

  const candidatesText = candidates
    .map((t, i) => `${i + 1}. ${t.title} — ${t.description}`)
    .join("\n");

  const { object } = await withRetry(
    () =>
      generateObject({
        model: TOPIC_MODEL,
        schema: topicMergeSchema,
        prompt: buildMergePrompt(bill, candidatesText),
        experimental_telemetry: {
          isEnabled: true,
          functionId: "user-topic-analysis-merge",
        },
      }),
    "merge"
  );

  return object.topics;
}
