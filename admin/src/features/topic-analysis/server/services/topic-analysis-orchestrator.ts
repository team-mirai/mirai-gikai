import "server-only";

import { registerNodeTelemetry } from "@/lib/telemetry/register";
import { ANALYSIS_STEPS } from "../../shared/constants";
import type { FlatOpinion, IntermediateResults } from "../../shared/types";
import {
  createClassifications,
  createTopics,
  createVersion,
  fetchBillWithContents,
  fetchCompletedInterviewReports,
  updateVersionResult,
  updateVersionStatus,
  updateVersionStep,
} from "../repositories/topic-analysis-repository";
import { extractTopics } from "./step1-extract-topics";
import { mergeTopics } from "./step2-merge-topics";
import { classifyOpinions } from "./step3-classify-opinions";
import { generateTopicReports } from "./step4-generate-topic-reports";
import { generateOverallSummary } from "./step5-generate-summary";

/**
 * トピック解析パイプラインのオーケストレーター（互換ラッパー）
 *
 * バージョンを作成し、パイプラインを実行する
 */
export async function runTopicAnalysis(billId: string) {
  await registerNodeTelemetry();

  const version = await createVersion(billId);
  await executeAnalysisPipeline(version.id, billId);
  return { versionId: version.id };
}

/**
 * トピック解析パイプラインを実行する
 *
 * 7ステップを順次実行し、結果をDBに保存する:
 * 1. データ取得
 * 2. トピック抽出
 * 3. トピック統合
 * 4. 意見分類
 * 5. トピックレポート生成
 * 6. 全体サマリ生成
 * 7. 結果保存
 */
export async function executeAnalysisPipeline(
  versionId: string,
  billId: string
) {
  try {
    await updateVersionStatus(versionId, "running");

    // Step 1: データ取得
    await updateVersionStep(versionId, ANALYSIS_STEPS.FETCH_DATA.label);
    console.log("[TopicAnalysis] Step 1: Fetching data...");
    const [billData, reports] = await Promise.all([
      fetchBillWithContents(billId),
      fetchCompletedInterviewReports(billId),
    ]);

    if (reports.length === 0) {
      throw new Error("解析対象のインタビューレポートがありません");
    }

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

    // Step 2: トピック抽出
    await updateVersionStep(versionId, ANALYSIS_STEPS.EXTRACT_TOPICS.label);
    console.log(
      `[TopicAnalysis] Step 2: Extracting topics from ${flatOpinions.length} opinions...`
    );
    const rawTopics = await extractTopics(
      flatOpinions,
      billData.billTitle,
      billData.billSummary
    );

    // Step 3: トピック統合
    await updateVersionStep(versionId, ANALYSIS_STEPS.MERGE_TOPICS.label);
    console.log(
      `[TopicAnalysis] Step 3: Merging ${rawTopics.length} raw topics...`
    );
    const mergedTopicNames = await mergeTopics(rawTopics, billData.billTitle);

    // Step 4: 意見分類
    await updateVersionStep(versionId, ANALYSIS_STEPS.CLASSIFY_OPINIONS.label);
    console.log(
      `[TopicAnalysis] Step 4: Classifying ${flatOpinions.length} opinions into ${mergedTopicNames.length} topics...`
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

    // Step 5: トピックレポート生成
    await updateVersionStep(versionId, ANALYSIS_STEPS.GENERATE_REPORTS.label);
    console.log("[TopicAnalysis] Step 5: Generating topic reports...");
    const topicInputs = activeTopics.map((name) => ({
      topicName: name,
      opinions: topicOpinionsMap.get(name) ?? [],
    }));

    const topicReports = await generateTopicReports(
      topicInputs,
      billData.billTitle,
      validSessionIds,
      billId
    );

    // Step 6: 全体サマリ生成
    await updateVersionStep(versionId, ANALYSIS_STEPS.GENERATE_SUMMARY.label);
    console.log("[TopicAnalysis] Step 6: Generating summary...");
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

    // Step 7: 結果保存
    await updateVersionStep(versionId, ANALYSIS_STEPS.SAVE_RESULTS.label);
    console.log("[TopicAnalysis] Step 7: Saving results to DB...");

    const createdTopics = await createTopics(
      versionId,
      topicReports.map((r, i) => ({
        name: r.name,
        description_md: r.description_md,
        representative_opinions: r.representative_opinions,
        sort_order: i,
      }))
    );

    const topicNameToId = new Map<string, string>();
    for (const topic of createdTopics) {
      topicNameToId.set(topic.name, topic.id);
    }

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

    const intermediateResults: IntermediateResults = {
      step1_raw_topics: rawTopics,
      step2_merged_topics: mergedTopicNames,
      step3_classifications: classifications,
      opinions_count: flatOpinions.length,
      sessions_count: reports.length,
    };

    await updateVersionResult(versionId, summaryMd, intermediateResults);

    console.log(
      `[TopicAnalysis] Completed successfully. Version: ${versionId}`
    );
  } catch (error) {
    console.error("[TopicAnalysis] Failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    await updateVersionStatus(versionId, "failed", errorMessage);
    throw error;
  }
}
