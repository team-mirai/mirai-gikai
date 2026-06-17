import { generateObject } from "ai";
import {
  EXTRACT_BATCH_SIZE,
  MAX_CONCURRENCY,
  TOPIC_MODEL,
} from "../shared/constants";
import { topicExtractionSchema } from "../shared/schemas";
import type { BillContext, TargetOpinion, TopicDraft } from "../shared/types";
import { chunk, mapWithConcurrency, withRetry } from "../utils/concurrency";
import { joinSummaryPoints } from "../utils/join-summary-points";
import { buildExtractPrompt } from "./prompts";

async function extractBatch(
  opinions: TargetOpinion[],
  bill: BillContext,
  batchIndex: number
): Promise<TopicDraft[]> {
  const opinionsText = opinions
    .map((o, i) => `[${i + 1}] ${o.title}\n${o.content}`)
    .join("\n\n");

  const { object } = await withRetry(
    () =>
      generateObject({
        model: TOPIC_MODEL,
        schema: topicExtractionSchema,
        prompt: buildExtractPrompt(bill, opinionsText),
        experimental_telemetry: {
          isEnabled: true,
          functionId: "user-topic-analysis-extract",
          metadata: { batchIndex: String(batchIndex) },
        },
      }),
    `extract batch=${batchIndex}`
  );

  return object.topics.map((t) => ({
    title: t.title,
    description: joinSummaryPoints(t.description_points),
  }));
}

/** Phase1: 意見をバッチ分割しトピック候補を並列抽出（Map）。 */
export async function extractTopics(
  opinions: TargetOpinion[],
  bill: BillContext
): Promise<TopicDraft[]> {
  if (opinions.length === 0) return [];
  const batches = chunk(opinions, EXTRACT_BATCH_SIZE);
  const perBatch = await mapWithConcurrency(batches, MAX_CONCURRENCY, (b, i) =>
    extractBatch(b, bill, i)
  );
  return perBatch.flat();
}
