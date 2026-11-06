import { createAdminClient } from "@mirai-gikai/supabase";
import type { OpinionToTag } from "../utils/build-opinion-tags-prompt";

/** タグ付け対象レポート（1レポート = 1回のLLM呼び出し）。 */
export type TagTargetReport = {
  reportId: string;
  sessionId: string;
  role: string | null;
  roleTitle: string | null;
};

// billId で絞る場合のみ議案までの join を付ける。
// interview_opinion → interview_report → interview_sessions → interview_configs は
// すべて NOT NULL の 1:1 なので !inner でも件数は変わらない。
const BILL_JOIN =
  "interview_report!inner(interview_sessions!inner(interview_configs!inner(bill_id)))";
const OPINION_WITH_BILL = `id, ${BILL_JOIN}`;
const OPINION_BILL_FILTER =
  "interview_report.interview_sessions.interview_configs.bill_id";

/**
 * 1レポートあたりの意見数の上限（opinionSchema の `opinions: z.array(...).max(3)`
 * と interview_opinion.opinion_index の 0..2 に対応）。
 * レポート単位で束ねるためのページサイズ算出に使う。
 */
const MAX_OPINIONS_PER_REPORT = 3;

/** タグ未抽出（tags_extracted_at IS NULL）の意見件数。進捗表示と継続判定に使う。 */
export async function countPendingTagExtraction(
  billId?: string
): Promise<number> {
  const supabase = createAdminClient();
  const query = billId
    ? supabase
        .from("interview_opinion")
        .select(OPINION_WITH_BILL, { count: "exact", head: true })
        .eq(OPINION_BILL_FILTER, billId)
    : supabase
        .from("interview_opinion")
        .select("id", { count: "exact", head: true });
  const { count, error } = await query.is("tags_extracted_at", null);

  if (error) {
    throw new Error(`Failed to count opinions: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * タグ未抽出の意見を持つレポートを最大 limit 件返す。
 *
 * タグ付けは1レポート分の意見をまとめて1回のLLM呼び出しで処理するため、対象は
 * レポート単位で束ねる。Supabase JS に DISTINCT が無いので、1レポートあたりの
 * 意見上限（MAX_OPINIONS_PER_REPORT）を掛けた行数を引いて JS 側で重複排除する。
 */
export async function findReportsToTag(
  limit: number,
  billId?: string
): Promise<TagTargetReport[]> {
  const supabase = createAdminClient();
  // 必要なのは interview_report_id だけ。billId 指定時のみ議案までの join を足す。
  const base = billId
    ? supabase
        .from("interview_opinion")
        .select(`interview_report_id, ${BILL_JOIN}`)
        .eq(OPINION_BILL_FILTER, billId)
    : supabase.from("interview_opinion").select("interview_report_id");

  const { data, error } = await base
    .is("tags_extracted_at", null)
    .order("interview_report_id", { ascending: true })
    .limit(limit * MAX_OPINIONS_PER_REPORT);

  if (error) {
    throw new Error(`Failed to fetch reports to tag: ${error.message}`);
  }

  const seen = new Set<string>();
  const reportIds: string[] = [];
  for (const row of data ?? []) {
    const reportId = row.interview_report_id;
    if (seen.has(reportId)) continue;
    seen.add(reportId);
    reportIds.push(reportId);
    if (reportIds.length >= limit) break;
  }
  if (reportIds.length === 0) return [];

  // 立場（role / role_title）はプロンプトの接地に使うため別途まとめて引く。
  // 並びは公開同意優先・古い順にするが、対象レポートの集合自体は1段目の
  // interview_report_id 昇順で決まっているので、この並べ替えが効くのは
  // チャンク内の処理順だけ（ジョブ全体で公開データが先に埋まるわけではない）。
  const { data: reports, error: reportError } = await supabase
    .from("interview_report")
    .select("id, interview_session_id, role, role_title")
    .in("id", reportIds)
    .order("is_public_by_user", { ascending: false })
    .order("created_at", { ascending: true });
  if (reportError) {
    throw new Error(`Failed to fetch report roles: ${reportError.message}`);
  }

  return (reports ?? []).map((r) => ({
    reportId: r.id,
    sessionId: r.interview_session_id,
    role: r.role,
    roleTitle: r.role_title,
  }));
}

/** 指定レポートのタグ未抽出の意見を opinion_index 昇順で返す。 */
export async function findUntaggedOpinions(
  reportId: string
): Promise<OpinionToTag[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_opinion")
    .select("opinion_index, title, content, contextual_quote, source_message_id")
    .eq("interview_report_id", reportId)
    .is("tags_extracted_at", null)
    .order("opinion_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch untagged opinions: ${error.message}`);
  }
  return data ?? [];
}

/** 1意見へ書き込むタグ。 */
export type OpinionTagsUpdate = {
  opinionIndex: number;
  concern: string | null;
  proposal: string | null;
  reasoningTypes: string[];
};

/**
 * 意見のタグ列だけを更新する（title/content 等の本文は触らない）。
 *
 * 本文を作り直さないことが重要。既存の再抽出経路はプロンプトごと意見を再生成するため
 * opinion_index に載る意見の中身が変わり、UUID を参照している topic_opinion の割当が
 * 実質ずれる（公開中のトピック分析の引用が差し替わる）。タグ付けはこれを避けるために
 * 追加専用にしている。
 *
 * 更新条件に `tags_extracted_at IS NULL` を残して compare-and-set にしている。
 * バックフィルは本番稼働中に走るため、対象抽出から更新までの間に同じレポートへ
 * ライブ生成の同期や再抽出が当たることがあり、無条件 UPDATE だと本物のタグを
 * 後から自分の生成結果で上書きしてしまう。
 *
 * 意見ごとに1文へ分けているが、途中で失敗しても未更新の行は
 * `tags_extracted_at IS NULL` のまま残り次回実行で再試行されるため、
 * 半端な状態は自己修復する。
 */
export async function updateOpinionTags(
  reportId: string,
  updates: OpinionTagsUpdate[],
  taggedAtIso: string
): Promise<void> {
  const supabase = createAdminClient();

  for (const update of updates) {
    const { error } = await supabase
      .from("interview_opinion")
      .update({
        concern: update.concern,
        proposal: update.proposal,
        reasoning_types: update.reasoningTypes,
        tags_extracted_at: taggedAtIso,
      })
      .eq("interview_report_id", reportId)
      .eq("opinion_index", update.opinionIndex)
      .is("tags_extracted_at", null);

    if (error) {
      throw new Error(`Failed to update opinion tags: ${error.message}`);
    }
  }
}

/**
 * LLM が特定の意見を返さなかった場合に、その意見のウォーターマークだけ進める。
 * 進めないと同じレポートが毎チャンク先頭に滞留して前進が止まる。
 */
export async function markOpinionsTagAttempted(
  reportId: string,
  opinionIndexes: number[],
  taggedAtIso: string
): Promise<void> {
  if (opinionIndexes.length === 0) return;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_opinion")
    .update({ tags_extracted_at: taggedAtIso })
    .eq("interview_report_id", reportId)
    .in("opinion_index", opinionIndexes)
    // 直前に立ったライブ生成のウォーターマークを空振りマークで塗り替えない。
    .is("tags_extracted_at", null);

  if (error) {
    throw new Error(`Failed to mark opinions tag attempted: ${error.message}`);
  }
}

/**
 * 指定議案の意見のタグ抽出ウォーターマークを NULL に戻す（scope="all" の起点）。
 * 1ページ取得→更新を繰り返し、全件をメモリに載せずに処理する。
 */
export async function resetTagExtractionForBill(
  billId: string
): Promise<number> {
  const supabase = createAdminClient();
  const pageSize = 1000;
  let reset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("interview_opinion")
      .select(OPINION_WITH_BILL)
      .eq(OPINION_BILL_FILTER, billId)
      .not("tags_extracted_at", "is", null)
      .order("id", { ascending: true })
      .limit(pageSize);
    if (error) {
      throw new Error(`Failed to fetch opinions to reset: ${error.message}`);
    }

    const ids = (data ?? []).map((r) => r.id);
    if (ids.length === 0) break;

    const { error: updateError } = await supabase
      .from("interview_opinion")
      .update({ tags_extracted_at: null })
      .in("id", ids);
    if (updateError) {
      throw new Error(
        `Failed to reset tag extraction watermark: ${updateError.message}`
      );
    }
    reset += ids.length;

    if (ids.length < pageSize) break;
  }

  return reset;
}
