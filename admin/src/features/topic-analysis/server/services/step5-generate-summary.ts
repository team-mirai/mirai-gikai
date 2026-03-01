import "server-only";

import { generateObject } from "ai";
import { TOPIC_ANALYSIS_MODEL } from "../../shared/constants";
import { overallSummarySchema } from "../../shared/schemas";

type TopicSummaryInput = {
  name: string;
  description_md: string;
  opinionsCount: number;
};

/**
 * Step 5: 全体サマリを生成する
 *
 * 全トピックのレポートをもとに、分析全体の要約文を生成する
 */
export async function generateOverallSummary(
  topics: TopicSummaryInput[],
  billTitle: string,
  totalOpinionsCount: number,
  totalSessionsCount: number
): Promise<string> {
  const topicsList = topics
    .map(
      (t, i) =>
        `### ${i + 1}. ${t.name}（関連意見: ${t.opinionsCount}件）\n${t.description_md}`
    )
    .join("\n\n");

  const result = await generateObject({
    model: TOPIC_ANALYSIS_MODEL,
    schema: overallSummarySchema,
    prompt: `あなたは市民意見の分析レポートの全体サマリを作成します。

## 法案
${billTitle}

## 分析概要
- 総セッション数: ${totalSessionsCount}
- 総意見数: ${totalOpinionsCount}
- 抽出トピック数: ${topics.length}

## タスク
以下の各トピックのレポートをもとに、分析全体のサマリ文章を作成してください。

### ルール
- markdown形式で記述してください
- 市民意見の全体的な傾向を簡潔にまとめてください
- 特に多くの意見が集まったトピックや、対立する意見が見られるトピックに注目してください
- 数値（意見数、セッション数）を適切に引用してください

## トピック別レポート
${topicsList}`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "topic-analysis-step5-summary",
      metadata: {
        topicsCount: String(topics.length),
        totalOpinions: String(totalOpinionsCount),
        totalSessions: String(totalSessionsCount),
      },
    },
  });

  return result.object.summary;
}
