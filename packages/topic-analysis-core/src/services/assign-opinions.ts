import { generateText } from "ai";
import {
  ASSIGN_BATCH_SIZE,
  MAX_CONCURRENCY,
  TOPIC_MODEL,
} from "../shared/constants";
import type {
  BillContext,
  FinalTopicWithId,
  OpinionAssignment,
  TargetOpinion,
} from "../shared/types";
import { chunk, mapWithConcurrency, withRetry } from "../utils/concurrency";
import { parseAssignmentTsv } from "../utils/parse-assignment-tsv";
import { buildAssignPrompt } from "./prompts";

async function assignBatch(
  opinions: TargetOpinion[],
  finalTopics: FinalTopicWithId[],
  bill: BillContext,
  validTopicIds: Set<string>,
  batchIndex: number
): Promise<OpinionAssignment[]> {
  // 改行を含む意見は1行=1意見のTSV契約を壊すため、空白に正規化してから並べる（§A.2）。
  const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
  const opinionsText = opinions
    .map((o, i) => `${i + 1}\t${oneLine(o.title)} / ${oneLine(o.content)}`)
    .join("\n");

  let assignmentMap: Map<number, string | null>;
  try {
    const { text } = await withRetry(
      () =>
        generateText({
          model: TOPIC_MODEL,
          prompt: buildAssignPrompt(bill, finalTopics, opinionsText),
          experimental_telemetry: {
            isEnabled: true,
            functionId: "user-topic-analysis-assign",
            metadata: { batchIndex: String(batchIndex) },
          },
        }),
      `assign batch=${batchIndex}`
    );
    assignmentMap = parseAssignmentTsv(text, opinions.length, validTopicIds);
  } catch (error) {
    // バッチ失敗（リトライ後）は全件 null に倒す（意見が消えない設計・§A.2）
    console.error(
      `[topic-analysis] assign batch=${batchIndex} failed, defaulting to null: ${
        error instanceof Error ? error.message : "unknown"
      }`
    );
    assignmentMap = new Map();
  }

  return opinions.map((o, i) => ({
    opinion_id: o.opinion_id,
    topic_local_id: assignmentMap.get(i + 1) ?? null,
  }));
}

/** Phase3: 全意見をバッチ分割し各意見へトピックを割当（Classify・§4.3）。 */
export async function assignOpinions(
  opinions: TargetOpinion[],
  finalTopics: FinalTopicWithId[],
  bill: BillContext
): Promise<OpinionAssignment[]> {
  if (opinions.length === 0) return [];
  if (finalTopics.length === 0) {
    return opinions.map((o) => ({
      opinion_id: o.opinion_id,
      topic_local_id: null,
    }));
  }

  const validTopicIds = new Set(finalTopics.map((t) => t.local_id));
  const batches = chunk(opinions, ASSIGN_BATCH_SIZE);
  const perBatch = await mapWithConcurrency(batches, MAX_CONCURRENCY, (b, i) =>
    assignBatch(b, finalTopics, bill, validTopicIds, i)
  );
  return perBatch.flat();
}
