import "server-only";

import { generateObject } from "ai";
import { z } from "zod";
import {
  TOPIC_ANALYSIS_BATCH_SIZE,
  TOPIC_ANALYSIS_MAX_CONCURRENCY,
  TOPIC_ANALYSIS_MODEL,
} from "../../shared/constants";
import type { FlatOpinion } from "../../shared/types";
import { retryTopicAnalysisRequest } from "../utils/retry-topic-analysis-request";

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// LLMには短い整数IDを渡し、レスポンス後にUUIDへマッピングする
const classifyBatchSchema = z.object({
  classifications: z.array(
    z.object({
      opinion_id: z.number().describe("意見の番号（意見一覧の[番号]に対応）"),
      topic_names: z.array(z.string()),
    })
  ),
});

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
  // 各意見に連番を振る（LLMにはUUIDを渡さない）
  const opinionsText = opinions
    .map((o, i) => `[${i + 1}] ${o.title}\n${o.content}`)
    .join("\n\n");

  const topicsText = topicNames.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const { object } = await retryTopicAnalysisRequest(
    () =>
      generateObject({
        model: TOPIC_ANALYSIS_MODEL,
        schema: classifyBatchSchema,
        prompt: `あなたは議案分析の専門家です。各意見を適切なトピックに分類してください。

## 法案
${billTitle}

## トピック一覧
${topicsText}

## 意見一覧
${opinionsText}

## タスク
各意見を1つ以上のトピックに分類してください。
- opinion_idは意見の[番号]から取得してください
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
      }),
    {
      label: `step3-classify batch=${batchIndex}`,
    }
  );

  // LLMが返した連番IDを元のinterview_report_id + opinion_indexにマッピング
  return object.classifications
    .filter((c) => c.opinion_id >= 1 && c.opinion_id <= opinions.length)
    .map((c) => {
      const opinion = opinions[c.opinion_id - 1];
      return {
        interview_report_id: opinion.interview_report_id,
        opinion_index: opinion.opinion_index,
        topic_names: c.topic_names,
      };
    });
}
