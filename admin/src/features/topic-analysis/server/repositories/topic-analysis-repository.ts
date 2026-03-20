import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { IntermediateResults, PhaseData } from "../../shared/types";

/**
 * 新しいバージョンを作成する（version番号は自動インクリメント）
 */
export async function createVersion(billId: string) {
  const supabase = createAdminClient();

  // 現在の最大バージョン番号を取得
  const { data: existing } = await supabase
    .from("topic_analysis_versions")
    .select("version")
    .eq("bill_id", billId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion =
    existing && existing.length > 0 ? existing[0].version + 1 : 1;

  const { data, error } = await supabase
    .from("topic_analysis_versions")
    .insert({
      bill_id: billId,
      version: nextVersion,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to create topic analysis version: ${error.message}`
    );
  }

  return data;
}

/**
 * バージョンのステータスを更新する
 */
export async function updateVersionStatus(
  versionId: string,
  status: "pending" | "running" | "completed" | "failed",
  errorMessage?: string
) {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    status,
    error_message: errorMessage ?? null,
  };

  if (status === "running") {
    updateData.started_at = new Date().toISOString();
  }
  if (status === "completed" || status === "failed") {
    updateData.completed_at = new Date().toISOString();
    updateData.current_step = null;
  }

  const { error } = await supabase
    .from("topic_analysis_versions")
    .update(updateData)
    .eq("id", versionId);

  if (error) {
    throw new Error(`Failed to update version status: ${error.message}`);
  }
}

/**
 * バージョンの現在のステップを更新する
 */
export async function updateVersionStep(
  versionId: string,
  currentStep: string
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("topic_analysis_versions")
    .update({ current_step: currentStep })
    .eq("id", versionId);

  if (error) {
    throw new Error(`Failed to update version step: ${error.message}`);
  }
}

/**
 * バージョンの解析結果を保存する
 */
export async function updateVersionResult(
  versionId: string,
  summaryMd: string,
  intermediateResults: IntermediateResults
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("topic_analysis_versions")
    .update({
      summary_md: summaryMd,
      intermediate_results: intermediateResults as never,
      status: "completed",
      completed_at: new Date().toISOString(),
      current_step: null,
    })
    .eq("id", versionId);

  if (error) {
    throw new Error(`Failed to update version result: ${error.message}`);
  }
}

/**
 * フェーズ間データを保存する
 */
export async function savePhaseData(versionId: string, phaseData: PhaseData) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("topic_analysis_versions")
    .update({ phase_data: phaseData as never })
    .eq("id", versionId);

  if (error) {
    throw new Error(`Failed to save phase data: ${error.message}`);
  }
}

/**
 * フェーズ間データを読み込む
 */
export async function loadPhaseData(versionId: string): Promise<PhaseData> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("topic_analysis_versions")
    .select("phase_data")
    .eq("id", versionId)
    .single();

  if (error) {
    throw new Error(`Failed to load phase data: ${error.message}`);
  }

  if (!data.phase_data) {
    throw new Error(`Phase data not found for version ${versionId}`);
  }

  return data.phase_data as PhaseData;
}

/**
 * 議案のバージョン一覧を取得する
 */
export async function findVersionsByBillId(billId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("topic_analysis_versions")
    .select("*")
    .eq("bill_id", billId)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch topic analysis versions: ${error.message}`
    );
  }

  return data;
}

/**
 * バージョンを ID で取得する
 */
export async function findVersionById(versionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("topic_analysis_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch topic analysis version: ${error.message}`);
  }

  return data;
}

/**
 * トピックを一括作成する
 */
export async function createTopics(
  versionId: string,
  topics: Array<{
    name: string;
    description_md: string;
    representative_opinions: Array<{
      session_id: string;
      opinion_title: string;
      opinion_content: string;
      source_message_content?: string | null;
    }>;
    sort_order: number;
  }>
) {
  const supabase = createAdminClient();

  const rows = topics.map((topic) => ({
    version_id: versionId,
    name: topic.name,
    description_md: topic.description_md,
    representative_opinions: topic.representative_opinions as never,
    sort_order: topic.sort_order,
  }));

  const { data, error } = await supabase
    .from("topic_analysis_topics")
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Failed to create topic analysis topics: ${error.message}`);
  }

  return data;
}

/**
 * 分類を一括作成する
 * バッチ挿入でFK制約違反が起きた場合は1件ずつ挿入にフォールバックし、
 * 不正な行をスキップしてレポート全体の出力を継続する
 */
export async function createClassifications(
  versionId: string,
  classifications: Array<{
    interview_report_id: string;
    topic_id: string;
    opinion_index: number;
  }>
) {
  const supabase = createAdminClient();

  const rows = classifications.map((c) => ({
    version_id: versionId,
    interview_report_id: c.interview_report_id,
    topic_id: c.topic_id,
    opinion_index: c.opinion_index,
  }));

  const { error } = await supabase
    .from("topic_analysis_classifications")
    .insert(rows);

  if (!error) {
    return;
  }

  // FK制約違反の場合、1件ずつ挿入してエラー行をスキップ
  if (error.code === "23503") {
    console.warn(
      `[TopicAnalysis] Batch insert failed with FK violation, falling back to row-by-row insert: ${error.message}`
    );
    let inserted = 0;
    let skipped = 0;
    for (const row of rows) {
      const { error: rowError } = await supabase
        .from("topic_analysis_classifications")
        .insert(row);
      if (rowError) {
        console.warn(
          `[TopicAnalysis] Skipped classification (report: ${row.interview_report_id}): ${rowError.message}`
        );
        skipped++;
      } else {
        inserted++;
      }
    }
    console.log(
      `[TopicAnalysis] Classifications: ${inserted} inserted, ${skipped} skipped`
    );
    return;
  }

  throw new Error(`Failed to create classifications: ${error.message}`);
}

/**
 * バージョンのトピック一覧を取得する
 */
export async function findTopicsByVersionId(versionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("topic_analysis_topics")
    .select("*")
    .eq("version_id", versionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch topic analysis topics: ${error.message}`);
  }

  return data;
}

/**
 * バージョンの分類一覧を取得する
 */
export async function findClassificationsByVersionId(versionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("topic_analysis_classifications")
    .select("*")
    .eq("version_id", versionId);

  if (error) {
    throw new Error(`Failed to fetch classifications: ${error.message}`);
  }

  return data;
}

/**
 * 議案とコンテンツを取得する
 */
export async function fetchBillWithContents(billId: string) {
  const supabase = createAdminClient();

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .single();

  if (billError) {
    throw new Error(`Failed to fetch bill: ${billError.message}`);
  }

  const { data: contents, error: contentsError } = await supabase
    .from("bill_contents")
    .select("*")
    .eq("bill_id", billId);

  if (contentsError) {
    throw new Error(`Failed to fetch bill contents: ${contentsError.message}`);
  }

  const normalContent = contents.find((c) => c.difficulty_level === "normal");

  return {
    bill,
    billTitle: normalContent?.title ?? bill.name,
    billContent: normalContent?.content ?? "",
    billSummary: normalContent?.summary ?? "",
  };
}

/**
 * 完了済みインタビューセッションのレポート一覧を取得する
 */
export async function fetchCompletedInterviewReports(billId: string) {
  const supabase = createAdminClient();

  // まず interview_configs から config_id を取得
  const { data: configs, error: configError } = await supabase
    .from("interview_configs")
    .select("id")
    .eq("bill_id", billId);

  if (configError) {
    throw new Error(
      `Failed to fetch interview configs: ${configError.message}`
    );
  }

  if (!configs || configs.length === 0) {
    return [];
  }

  const configIds = configs.map((c) => c.id);

  // 完了済みセッションとレポートを取得
  const { data: sessions, error: sessionsError } = await supabase
    .from("interview_sessions")
    .select(
      `
      id,
      interview_report(*)
    `
    )
    .in("interview_config_id", configIds)
    .not("completed_at", "is", null);

  if (sessionsError) {
    throw new Error(
      `Failed to fetch interview sessions: ${sessionsError.message}`
    );
  }

  // レポートが存在し、opinions が null でないものだけを返す
  const reports: Array<{
    session_id: string;
    report_id: string;
    opinions: Array<{
      title: string;
      content: string;
      source_message_id?: string | null;
      source_message_content?: string | null;
    }>;
  }> = [];

  for (const session of sessions) {
    const report = Array.isArray(session.interview_report)
      ? session.interview_report[0]
      : session.interview_report;

    if (report?.opinions) {
      const opinions = Array.isArray(report.opinions)
        ? (report.opinions as Array<{
            title: string;
            content: string;
            source_message_id?: string | null;
            source_message_content?: string | null;
          }>)
        : [];

      if (opinions.length > 0) {
        reports.push({
          session_id: session.id,
          report_id: report.id,
          opinions,
        });
      }
    }
  }

  return reports;
}
