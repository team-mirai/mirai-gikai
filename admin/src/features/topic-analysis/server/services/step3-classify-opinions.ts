import "server-only";

import { generateObject } from "ai";
import {
  TOPIC_ANALYSIS_BATCH_SIZE,
  TOPIC_ANALYSIS_MAX_CONCURRENCY,
  TOPIC_ANALYSIS_MODEL,
} from "../../shared/constants";
import { opinionClassificationSchema } from "../../shared/schemas";
import type { FlatOpinion } from "../../shared/types";

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

type ClassificationResult = {
  interview_report_id: string;
  opinion_index: number;
  topic_names: string[];
};

/**
 * Step 3: 意見をトピックに分類する
 */
export async function classifyOpinions(
  opinions: FlatOpinion[],
  topicNames: string[],
  billTitle: string
): Promise<ClassificationResult[]> {
  const batches = chunk(opinions, TOPIC_ANALYSIS_BATCH_SIZE);
  const allClassifications: ClassificationResult[] = [];

  for (let i = 0; i < batches.length; i += TOPIC_ANALYSIS_MAX_CONCURRENCY) {
    const concurrent = batches.slice(i, i + TOPIC_ANALYSIS_MAX_CONCURRENCY);
    const results = await Promise.all(
      concurrent.map((batch, batchIndex) =>
        classifyBatch(batch, topicNames, billTitle, i + batchIndex)
      )
    );
    for (const result of results) {
      allClassifications.push(...result);
    }
  }

  return allClassifications;
}

async function classifyBatch(
  opinions: FlatOpinion[],
  topicNames: string[],
  billTitle: string,
  batchIndex: number
): Promise<ClassificationResult[]> {
  const opinionsText = opinions
    .map(
      (o) =>
        `[report:${o.interview_report_id}, index:${o.opinion_index}] ${o.title}\n${o.content}`
    )
    .join("\n\n");

  const topicsText = topicNames.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const { object } = await generateObject({
    model: TOPIC_ANALYSIS_MODEL,
    schema: opinionClassificationSchema,
    prompt: `あなたは議案分析の専門家です。各意見を適切なトピックに分類してください。

## 法案
${billTitle}

## トピック一覧
${topicsText}

## 意見一覧
${opinionsText}

## タスク
各意見を1つ以上のトピックに分類してください。
- interview_report_idとopinion_indexは意見の[report:..., index:...]から取得してください
- topic_namesには分類先のトピック名を配列で指定してください
- 1つの意見が複数のトピックに該当する場合は複数指定してください
- どのトピックにも該当しない意見は空配列にしてください`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "topic-analysis-step3-classify",
      metadata: {
        batchIndex: String(batchIndex),
      },
    },
  });

  return object.classifications;
}
