import "server-only";

import { registerNodeTelemetry } from "@/lib/telemetry/register";
import type { FlatOpinion, IntermediateResults } from "../../shared/types";
import {
  createClassifications,
  createTopics,
  createVersion,
  fetchBillWithContents,
  fetchCompletedInterviewReports,
  updateVersionResult,
  updateVersionStatus,
} from "../repositories/topic-analysis-repository";
import { extractTopics } from "./step1-extract-topics";
import { mergeTopics } from "./step2-merge-topics";
import { classifyOpinions } from "./step3-classify-opinions";
import { generateTopicReports } from "./step4-generate-topic-reports";
import { generateOverallSummary } from "./step5-generate-summary";

/**
 * トピック解析パイプラインのオーケストレーター
 *
 * 5ステップを順次実行し、結果をDBに保存する:
 * 1. トピック抽出
 * 2. トピックマージ
 * 3. 意見分類
 * 4. トピック説明生成
 * 5. 全体サマリ生成
 */
export async function runTopicAnalysis(billId: string) {
  // Langfuse telemetry を初期化
  await registerNodeTelemetry();

  // バージョンを作成
  const version = await createVersion(billId);
  const versionId = version.id;

  try {
    // ステータスを running に更新
    await updateVersionStatus(versionId, "running");

    // 入力データ取得
    const [billData, reports] = await Promise.all([
      fetchBillWithContents(billId),
      fetchCompletedInterviewReports(billId),
    ]);

    if (reports.length === 0) {
      throw new Error("解析対象のインタビューレポートがありません");
    }

    // opinions を flat なリストに変換
    const flatOpinions: FlatOpinion[] = [];
    for (const report of reports) {
      for (let i = 0; i < report.opinions.length; i++) {
        flatOpinions.push({
          interview_report_id: report.report_id,
          session_id: report.session_id,
          opinion_index: i,
          title: report.opinions[i].title,
          content: report.opinions[i].content,
        });
      }
    }

    const validSessionIds = new Set(reports.map((r) => r.session_id));

    // Step 1: トピック抽出
    console.log(
      `[TopicAnalysis] Step 1: Extracting topics from ${flatOpinions.length} opinions...`
    );
    const rawTopics = await extractTopics(
      flatOpinions,
      billData.billTitle,
      billData.billSummary
    );

    // Step 2: トピックマージ
    console.log(
      `[TopicAnalysis] Step 2: Merging ${rawTopics.length} raw topics...`
    );
    const mergedTopicNames = await mergeTopics(rawTopics, billData.billTitle);

    // Step 3: 意見分類
    console.log(
      `[TopicAnalysis] Step 3: Classifying ${flatOpinions.length} opinions into ${mergedTopicNames.length} topics...`
    );
    const classifications = await classifyOpinions(
      flatOpinions,
      mergedTopicNames,
      billData.billTitle
    );

    // トピックごとの意見をグループ化
    const topicOpinionsMap = new Map<string, FlatOpinion[]>();
    for (const topicName of mergedTopicNames) {
      topicOpinionsMap.set(topicName, []);
    }
    for (const c of classifications) {
      const opinion = flatOpinions.find(
        (o) =>
          o.interview_report_id === c.interview_report_id &&
          o.opinion_index === c.opinion_index
      );
      if (opinion) {
        for (const topicName of c.topic_names) {
          const list = topicOpinionsMap.get(topicName);
          if (list) {
            list.push(opinion);
          }
        }
      }
    }

    // 意見が0件のトピックを除外
    const activeTopics = mergedTopicNames.filter(
      (name) => (topicOpinionsMap.get(name)?.length ?? 0) > 0
    );

    // Step 4: トピック説明生成
    console.log(`[TopicAnalysis] Step 4: Generating topic reports...`);
    const topicInputs = activeTopics.map((name) => ({
      topicName: name,
      opinions: topicOpinionsMap.get(name) ?? [],
    }));

    const topicReports = await generateTopicReports(
      topicInputs,
      billData.billTitle,
      validSessionIds
    );

    // Step 5: 全体サマリ生成
    console.log(`[TopicAnalysis] Step 5: Generating summary...`);
    const summaryMd = await generateOverallSummary(
      topicReports.map((r) => ({
        name: r.name,
        description_md: r.description_md,
        opinionsCount: topicOpinionsMap.get(r.name)?.length ?? 0,
      })),
      billData.billTitle,
      flatOpinions.length,
      reports.length
    );

    // DB に結果を保存
    console.log(`[TopicAnalysis] Saving results to DB...`);

    // トピックを作成
    const createdTopics = await createTopics(
      versionId,
      topicReports.map((r, i) => ({
        name: r.name,
        description_md: r.description_md,
        representative_opinions: r.representative_opinions,
        sort_order: i,
      }))
    );

    // トピック名 → ID のマップを作成
    const topicNameToId = new Map<string, string>();
    for (const topic of createdTopics) {
      topicNameToId.set(topic.name, topic.id);
    }

    // 分類を作成
    const classificationRows: Array<{
      interview_report_id: string;
      topic_id: string;
      opinion_index: number;
    }> = [];

    for (const c of classifications) {
      for (const topicName of c.topic_names) {
        const topicId = topicNameToId.get(topicName);
        if (topicId) {
          classificationRows.push({
            interview_report_id: c.interview_report_id,
            topic_id: topicId,
            opinion_index: c.opinion_index,
          });
        }
      }
    }

    if (classificationRows.length > 0) {
      await createClassifications(versionId, classificationRows);
    }

    // 中間結果を構築
    const intermediateResults: IntermediateResults = {
      step1_raw_topics: rawTopics,
      step2_merged_topics: mergedTopicNames,
      step3_classifications: classifications,
      opinions_count: flatOpinions.length,
      sessions_count: reports.length,
    };

    // バージョンを完了に更新
    await updateVersionResult(versionId, summaryMd, intermediateResults);

    console.log(
      `[TopicAnalysis] Completed successfully. Version: ${versionId}`
    );

    return { versionId };
  } catch (error) {
    console.error(`[TopicAnalysis] Failed:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    await updateVersionStatus(versionId, "failed", errorMessage);
    throw error;
  }
}
