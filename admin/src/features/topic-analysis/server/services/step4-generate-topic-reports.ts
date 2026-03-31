import "server-only";

import { generateObject } from "ai";
import {
  TOPIC_ANALYSIS_MAX_CONCURRENCY,
  TOPIC_ANALYSIS_MODEL,
} from "../../shared/constants";
import { topicReportSchema } from "../../shared/schemas";
import type { FlatOpinion, RepresentativeOpinion } from "../../shared/types";
import { validateAndReplaceReferences } from "../utils/validate-references";

type TopicReportInput = {
  topicName: string;
  opinions: FlatOpinion[];
};

type TopicReportOutput = {
  name: string;
  description_md: string;
  representative_opinions: RepresentativeOpinion[];
};

/**
 * Step 4: 各トピックの説明文と代表意見を生成する
 *
 * トピックごとに説明文をmarkdown形式で生成し、
 * [ref:N]マーカーのグラウンディング検証を行う
 */
export async function generateTopicReports(
  topics: TopicReportInput[],
  billTitle: string,
  validSessionIds: Set<string>,
  billId: string,
  sessionConfigMap: Record<string, string>
): Promise<TopicReportOutput[]> {
  const results = await runWithConcurrency(
    topics,
    TOPIC_ANALYSIS_MAX_CONCURRENCY,
    (topic) =>
      generateSingleTopicReport(
        topic,
        billTitle,
        validSessionIds,
        billId,
        sessionConfigMap
      )
  );

  return results;
}

async function generateSingleTopicReport(
  input: TopicReportInput,
  billTitle: string,
  validSessionIds: Set<string>,
  billId: string,
  sessionConfigMap: Record<string, string>
): Promise<TopicReportOutput> {
  const opinionsText = input.opinions
    .map(
      (o, i) => `[${i + 1}] [session:${o.session_id}] ${o.title}\n${o.content}`
    )
    .join("\n\n");

  const sessionIds = [...new Set(input.opinions.map((o) => o.session_id))];
  const sessionList = sessionIds.map((id, i) => `  ${i + 1}. ${id}`).join("\n");

  const result = await generateObject({
    model: TOPIC_ANALYSIS_MODEL,
    schema: topicReportSchema,
    prompt: `あなたは市民意見の分析レポートを作成します。

## 法案
${billTitle}

## トピック
${input.topicName}

## タスク
このトピックに分類された以下の意見群をもとに、トピックの説明文を作成してください。

### ルール
- description はmarkdown形式で記述してください
- 太字（**）は短いキーワードや数値（例: **個別最適化**、**38件**）にのみ使い、文をまたいで長い範囲に適用しないでください
- 意見を引用・参照する箇所には [ref:N] マーカーを付けてください（Nは references 配列のインデックス+1）
- references には実際に参照した session_id を記載してください
- representative_opinion_ids には、このトピックを代表する意見の番号（意見一覧の[番号]に対応）を最大5件選んでください

### 利用可能なセッションID
${sessionList}

## このトピックに分類された意見
${opinionsText}`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "topic-analysis-step4-report",
      metadata: {
        topicName: input.topicName,
        opinionsCount: String(input.opinions.length),
      },
    },
  });

  const report = result.object;

  // グラウンディング検証: 無効な参照を除去し、[ref:N]を置換
  const { cleanedMd, validReferences } = validateAndReplaceReferences(
    report.description,
    report.references,
    validSessionIds,
    billId,
    sessionConfigMap
  );

  // LLMが返した意見番号から元データを直接参照して代表意見を構築
  const enrichedRepresentatives: RepresentativeOpinion[] =
    report.representative_opinion_ids
      .filter((id) => id >= 1 && id <= input.opinions.length)
      .map((id) => {
        const opinion = input.opinions[id - 1];
        const ref = validReferences.find(
          (r) => r.session_id === opinion.session_id
        );
        return {
          session_id: opinion.session_id,
          opinion_title: opinion.title,
          opinion_content: opinion.content,
          source_message_content: opinion.source_message_content ?? null,
          ref_id: ref?.ref_id ?? null,
        };
      })
      .filter((op) => validSessionIds.has(op.session_id));

  return {
    name: input.topicName,
    description_md: cleanedMd,
    representative_opinions: enrichedRepresentatives,
  };
}

async function runWithConcurrency<T, R>(
  items: T[],
  maxConcurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);

  return results;
}
