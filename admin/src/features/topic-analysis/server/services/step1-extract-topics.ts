import "server-only";

import { generateObject } from "ai";
import {
  TOPIC_ANALYSIS_BATCH_SIZE,
  TOPIC_ANALYSIS_MAX_CONCURRENCY,
  TOPIC_ANALYSIS_MODEL,
} from "../../shared/constants";
import { topicExtractionSchema } from "../../shared/schemas";
import type { FlatOpinion } from "../../shared/types";

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Step 1: 意見リストからトピックを抽出する
 * バッチに分割し、並列でLLM呼び出しを行う
 */
export async function extractTopics(
  opinions: FlatOpinion[],
  billTitle: string,
  billSummary: string
): Promise<string[]> {
  const batches = chunk(opinions, TOPIC_ANALYSIS_BATCH_SIZE);
  const allTopics: string[] = [];

  // チャンク並列実行（MAX_CONCURRENCY ずつ）
  for (let i = 0; i < batches.length; i += TOPIC_ANALYSIS_MAX_CONCURRENCY) {
    const concurrent = batches.slice(i, i + TOPIC_ANALYSIS_MAX_CONCURRENCY);
    const results = await Promise.all(
      concurrent.map((batch, batchIndex) =>
        extractTopicsFromBatch(batch, billTitle, billSummary, i + batchIndex)
      )
    );
    for (const result of results) {
      allTopics.push(...result);
    }
  }

  return allTopics;
}

async function extractTopicsFromBatch(
  opinions: FlatOpinion[],
  billTitle: string,
  billSummary: string,
  batchIndex: number
): Promise<string[]> {
  const opinionsText = opinions
    .map((o, i) => `[${i + 1}] ${o.title}\n${o.content}`)
    .join("\n\n");

  const { object } = await generateObject({
    model: TOPIC_ANALYSIS_MODEL,
    schema: topicExtractionSchema,
    prompt: `あなたは議案に対する市民の意見を分析する専門家です。

## 議案情報
タイトル: ${billTitle}
概要: ${billSummary}

## 意見一覧
${opinionsText}

## タスク
上記の意見一覧から、主要なトピック（論点・テーマ）を抽出してください。
- 各トピック名は40文字以内で、具体的な内容を含む1文にしてください
- 似たような意見はまとめて1つのトピックにしてください
- 意見が少ない場合でも最低1つのトピックを抽出してください`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "topic-analysis-step1-extract",
      metadata: {
        batchIndex: String(batchIndex),
      },
    },
  });

  return object.topics.map((t) => t.name);
}
