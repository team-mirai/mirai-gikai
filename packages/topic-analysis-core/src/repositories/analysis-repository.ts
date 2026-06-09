import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  BillContext,
  ProgressData,
  TargetOpinion,
  TopicDraft,
} from "../shared/types";

type VersionStatus = "pending" | "running" | "completed" | "failed";

/**
 * §8 フィルタ後の分析対象意見を取得する。
 * interview_opinion → interview_report(is_public_by_user=true, moderation_status='ok')
 * → interview_sessions → interview_configs(bill_id) を辿る。
 */
export async function fetchTargetOpinions(
  billId: string
): Promise<TargetOpinion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_opinion")
    .select(
      `id, opinion_index, title, content, contextual_quote, bill_sentiment, interview_report_id,
       interview_report!inner(
         is_public_by_user, moderation_status, role,
         interview_sessions!inner(
           interview_configs!inner(bill_id)
         )
       )`
    )
    .eq("interview_report.is_public_by_user", true)
    .eq("interview_report.moderation_status", "ok")
    .eq("interview_report.interview_sessions.interview_configs.bill_id", billId)
    .order("interview_report_id", { ascending: true })
    .order("opinion_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch target opinions: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const report = row.interview_report as unknown as {
      role: string | null;
    };
    return {
      opinion_id: row.id,
      interview_report_id: row.interview_report_id,
      opinion_index: row.opinion_index,
      title: row.title,
      content: row.content,
      contextual_quote: row.contextual_quote,
      bill_sentiment: row.bill_sentiment,
      role: report?.role ?? null,
    };
  });
}

/** 議案コンテキスト（プロンプト接地用）を取得する。本文は bill_contents（normal）から。 */
export async function fetchBillContext(billId: string): Promise<BillContext> {
  const supabase = createAdminClient();
  const { data: bill, error } = await supabase
    .from("bills")
    .select("name")
    .eq("id", billId)
    .single();
  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }

  const { data: contents, error: contentsError } = await supabase
    .from("bill_contents")
    .select("summary, content, difficulty_level")
    .eq("bill_id", billId);
  if (contentsError) {
    throw new Error(`Failed to fetch bill contents: ${contentsError.message}`);
  }
  const normal =
    contents?.find((c) => c.difficulty_level === "normal") ?? contents?.[0];

  return {
    name: bill.name,
    summary: normal?.summary ?? null,
    body: normal?.content ?? null,
  };
}

/** bill 内で running/pending の version があれば返す（二重起動防止用・§5.3）。 */
export async function findActiveVersionByBill(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic_analysis_version")
    .select("id, status, started_at, created_at")
    .eq("bill_id", billId)
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check active version: ${error.message}`);
  }
  return data;
}

/** 新しい version を作成する（bill 内連番）。 */
export async function createVersion(
  billId: string,
  trigger: "manual" | "cron",
  model: string,
  promptVersion: string
) {
  const supabase = createAdminClient();
  const { data: last, error: lastError } = await supabase
    .from("topic_analysis_version")
    .select("version")
    .eq("bill_id", billId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) {
    throw new Error(`Failed to read last version: ${lastError.message}`);
  }
  const nextVersion = (last?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from("topic_analysis_version")
    .insert({
      bill_id: billId,
      version: nextVersion,
      status: "pending",
      trigger,
      model,
      prompt_version: promptVersion,
    })
    .select()
    .single();

  if (error) {
    // 一意制約違反（23505）= 同時実行で既に active な version が作られた／同一 version 番号が衝突した。
    // one_active_version_per_bill による二重起動ガードに弾かれたケースなので、
    // エラーにせず null を返して呼び出し側でスキップ扱いにする（TOCTOU 対策）。
    if (error.code === "23505") {
      return null;
    }
    throw new Error(`Failed to create version: ${error.message}`);
  }
  return data;
}

export async function updateVersionStatus(
  versionId: string,
  status: VersionStatus,
  errorMessage?: string
): Promise<void> {
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = { status };
  if (status === "running") patch.started_at = new Date().toISOString();
  if (errorMessage !== undefined) patch.error_message = errorMessage;
  const { error } = await supabase
    .from("topic_analysis_version")
    .update(patch)
    .eq("id", versionId);
  if (error) {
    throw new Error(`Failed to update version status: ${error.message}`);
  }
}

export async function updateVersionStep(
  versionId: string,
  step: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("topic_analysis_version")
    .update({ current_step: step })
    .eq("id", versionId);
  if (error) {
    throw new Error(`Failed to update version step: ${error.message}`);
  }
}

export async function saveProgress(
  versionId: string,
  progress: ProgressData
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("topic_analysis_version")
    .update({ progress: progress as never })
    .eq("id", versionId);
  if (error) {
    throw new Error(`Failed to save progress: ${error.message}`);
  }
}

export async function loadProgress(versionId: string): Promise<ProgressData> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic_analysis_version")
    .select("progress")
    .eq("id", versionId)
    .single();
  if (error) {
    throw new Error(`Failed to load progress: ${error.message}`);
  }
  if (!data.progress) {
    throw new Error(`Progress not found for version ${versionId}`);
  }
  return data.progress as unknown as ProgressData;
}

/**
 * トピックと割当を保存する。
 * sortedTopics は表示順（opinion 件数降順）に並んだ最終トピック。
 * assignments は opinion_id → topics 配列内の index（未分類は含めない）。
 */
export async function saveTopicsAndAssignments(
  versionId: string,
  sortedTopics: TopicDraft[],
  assignments: Array<{ opinion_id: string; topic_index: number }>
): Promise<void> {
  const supabase = createAdminClient();

  if (sortedTopics.length === 0) return;

  const { data: inserted, error: topicError } = await supabase
    .from("topic")
    .insert(
      sortedTopics.map((t, index) => ({
        version_id: versionId,
        title: t.title,
        description: t.description,
        sort_order: index,
      }))
    )
    .select("id, sort_order");
  if (topicError) {
    throw new Error(`Failed to insert topics: ${topicError.message}`);
  }

  // sort_order(=挿入時の index) → topic_id の対応表。
  // 挿入順ではなく sort_order 値で引くため、返却順に依存しない。
  const idBySortOrder = new Map<number, string>();
  for (const row of inserted ?? []) {
    idBySortOrder.set(row.sort_order, row.id);
  }

  const topicOpinionRows = assignments
    .map((a) => {
      const topicId = idBySortOrder.get(a.topic_index);
      return topicId
        ? { version_id: versionId, opinion_id: a.opinion_id, topic_id: topicId }
        : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (topicOpinionRows.length > 0) {
    const { error: toError } = await supabase
      .from("topic_opinion")
      .insert(topicOpinionRows);
    if (toError) {
      throw new Error(`Failed to insert topic_opinion: ${toError.message}`);
    }
  }
}

/** 完了処理（status=completed, current_step=done, 件数・時刻を記録）。 */
export async function finalizeVersion(
  versionId: string,
  sourceOpinionCount: number
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("topic_analysis_version")
    .update({
      status: "completed",
      current_step: "done",
      source_opinion_count: sourceOpinionCount,
      completed_at: new Date().toISOString(),
      progress: null,
    })
    .eq("id", versionId);
  if (error) {
    throw new Error(`Failed to finalize version: ${error.message}`);
  }
}

/** ステータス取得（UI ポーリング用）。 */
export async function getVersionStatus(versionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic_analysis_version")
    .select(
      "id, bill_id, version, status, current_step, source_opinion_count, error_message, started_at, completed_at"
    )
    .eq("id", versionId)
    .single();
  if (error) {
    throw new Error(`Failed to get version status: ${error.message}`);
  }
  return data;
}

/** bill のバージョン一覧（結果ビュー用）。 */
export async function listVersionsByBill(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic_analysis_version")
    .select(
      "id, version, status, is_published, current_step, source_opinion_count, created_at, completed_at"
    )
    .eq("bill_id", billId)
    .order("version", { ascending: false });
  if (error) {
    throw new Error(`Failed to list versions: ${error.message}`);
  }
  return data ?? [];
}

/** version のトピックと割当意見（結果ビュー用）。 */
export async function getTopicsWithOpinions(versionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic")
    .select(
      `id, title, description, sort_order,
       topic_opinion(
         interview_opinion(id, title, content, contextual_quote, bill_sentiment)
       )`
    )
    .eq("version_id", versionId)
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(`Failed to get topics: ${error.message}`);
  }
  return data ?? [];
}
