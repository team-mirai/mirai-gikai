import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import { countPublicReportsByBillId } from "@mirai-gikai/shared/report-publication/count-public-reports";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  PublishedVersionMeta,
  RawOpinionRow,
  RawRespondentDetailRow,
  RawRespondentRow,
  RawTopicRow,
  RawTranscriptMessageRow,
} from "./public-types";

export type PublishedAnalysisData = {
  meta: PublishedVersionMeta;
  rawTopics: RawTopicRow[];
};

/**
 * 指定 version のトピック＋意見（§8 判定に必要な interview_report 属性込み）を生データで取得する。
 * version の選び方（公開中 / 最新）に依存しない共通処理。フィルタ・集計は純粋関数側で行う。
 */
async function fetchAnalysisData(
  version: { id: string; version: number; completed_at: string | null },
  billId: string
): Promise<PublishedAnalysisData> {
  const supabase = createAdminClient();
  const { data: topics, error: topicsError } = await supabase
    .from("topic")
    .select(
      `id, title, description, sort_order,
       topic_opinion(
         interview_opinion(
           id, title, content, contextual_quote, bill_sentiment, richness, source_message_id, interview_report_id,
           interview_report!inner(is_public_by_user, is_public_by_admin, moderation_status, role, role_title, created_at)
         )
       )`
    )
    .eq("version_id", version.id)
    .order("sort_order", { ascending: true });
  if (topicsError) {
    throw new Error(`Failed to fetch topics: ${topicsError.message}`);
  }

  const rawTopics: RawTopicRow[] = (topics ?? []).map((t) => {
    const opinions: RawOpinionRow[] = [];
    for (const link of t.topic_opinion ?? []) {
      const o = link.interview_opinion as unknown as
        | (Omit<
            RawOpinionRow,
            | "is_public_by_user"
            | "moderation_status"
            | "role"
            | "role_title"
            | "created_at"
          > & {
            interview_report: {
              is_public_by_user: boolean;
              is_public_by_admin: boolean;
              moderation_status: string | null;
              role: string | null;
              role_title: string | null;
              created_at: string | null;
            } | null;
          })
        | null;
      if (!o || !o.interview_report) continue;
      opinions.push({
        id: o.id,
        interview_report_id: o.interview_report_id,
        created_at: o.interview_report.created_at,
        title: o.title,
        content: o.content,
        contextual_quote: o.contextual_quote,
        source_message_id: o.source_message_id,
        bill_sentiment: o.bill_sentiment,
        richness: o.richness,
        is_public_by_user: o.interview_report.is_public_by_user,
        is_public_by_admin: o.interview_report.is_public_by_admin,
        moderation_status: o.interview_report.moderation_status,
        role: o.interview_report.role,
        role_title: o.interview_report.role_title,
      });
    }
    return { id: t.id, title: t.title, description: t.description, opinions };
  });

  return {
    meta: {
      bill_id: billId,
      version: version.version,
      generated_at: version.completed_at,
    },
    rawTopics,
  };
}

/**
 * 議案の「公開中（is_published=true）」のトピック分析を生データで取得する（web 公開ページ用）。
 * 公開中 version が無ければ null（呼び出し側で「準備中」扱い）。
 */
export async function findPublishedAnalysis(
  billId: string
): Promise<PublishedAnalysisData | null> {
  const supabase = createAdminClient();
  // bill ごと公開は最大1版（one_published_per_bill）。
  const { data: version, error } = await supabase
    .from("topic_analysis_version")
    .select("id, version, completed_at")
    .eq("bill_id", billId)
    .eq("is_published", true)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to fetch published version: ${error.message}`);
  }
  if (!version) return null;
  return fetchAnalysisData(version, billId);
}

/**
 * 議案の最新トピック分析を生データで取得する（公開・非公開を問わず最大 version を返す）。
 * 内部用途（admin MCP）向け。version が無ければ null。
 */
export async function findLatestAnalysis(
  billId: string
): Promise<PublishedAnalysisData | null> {
  const supabase = createAdminClient();
  const { data: version, error } = await supabase
    .from("topic_analysis_version")
    .select("id, version, completed_at")
    .eq("bill_id", billId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to fetch latest version: ${error.message}`);
  }
  if (!version) return null;
  return fetchAnalysisData(version, billId);
}

/** モデレーション状態（interview_report.moderation_status の列挙）。 */
export type ModerationStatus = "ok" | "warning" | "ng";

/** レポート行に対する取得条件。未指定の項目は制約しない（＝全件対象）。 */
export type ReportRowFilter = {
  isPublicByAdmin?: boolean;
  isPublicByUser?: boolean;
  moderationStatus?: ModerationStatus;
};

/** web 公開ページのプリセット（管理者公開 × ユーザー公開）。 */
const PUBLIC_REPORT_FILTER: ReportRowFilter = {
  isPublicByAdmin: true,
  isPublicByUser: true,
};

/**
 * 議案に紐づく回答者レポート行を取得する（回答一覧用・新しい順）。
 * filter で公開フラグ・モデレーション状態を任意に絞り込む（未指定なら制約しない＝全件）。
 */
export async function findRespondentRows(
  billId: string,
  filter: ReportRowFilter = {}
): Promise<RawRespondentRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("interview_report")
    .select(
      `id, role, role_title, stance, summary, created_at,
       interview_sessions!inner(interview_configs!inner(bill_id))`
    )
    .eq("interview_sessions.interview_configs.bill_id", billId);
  if (filter.isPublicByAdmin !== undefined) {
    query = query.eq("is_public_by_admin", filter.isPublicByAdmin);
  }
  if (filter.isPublicByUser !== undefined) {
    query = query.eq("is_public_by_user", filter.isPublicByUser);
  }
  if (filter.moderationStatus !== undefined) {
    query = query.eq("moderation_status", filter.moderationStatus);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch bill respondents: ${error.message}`);
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    role: r.role,
    role_title: r.role_title,
    stance: r.stance,
    summary: r.summary,
    created_at: r.created_at,
  }));
}

/**
 * web 公開ページ用: 公開（管理者公開 × ユーザー公開）のレポートのみ取得する。
 * 挙動は従来どおり（PUBLIC_REPORT_FILTER 固定）。
 */
export async function findPublicBillRespondentRows(
  billId: string
): Promise<RawRespondentRow[]> {
  return findRespondentRows(billId, PUBLIC_REPORT_FILTER);
}

export type RespondentDetailData = {
  report: RawRespondentDetailRow;
  messages: RawTranscriptMessageRow[];
};

/** 回答者詳細の取得条件。未指定の公開フラグ／モデレーションは制約しない。 */
export type RespondentDetailFilter = {
  isPublicByAdmin?: boolean;
  isPublicByUser?: boolean;
  moderationStatus?: ModerationStatus;
  /** true のとき web と同じ k-匿名性ゲート（公開レポート >= 20 件）を適用。 */
  requireDisplayThreshold?: boolean;
};

/**
 * レポート1件の詳細（立場説明＋会話ログ）を生データで取得する（内部用途）。
 * filter で公開フラグ・モデレーション状態を任意に絞り込み、`requireDisplayThreshold` を
 * 指定したときのみ web 個別レポート詳細（getPublicReportById）と同じ k-匿名性ゲート
 * （公開レポートが `shouldDisplayPublicReports` を満たす＝20件以上）を適用する。
 * 条件に合致しない・存在しない場合は null（呼び出し側で not_found 扱い）。会話メッセージは作成日時昇順。
 */
export async function findRespondentDetail(
  reportId: string,
  filter: RespondentDetailFilter = {}
): Promise<RespondentDetailData | null> {
  const supabase = createAdminClient();

  let query = supabase
    .from("interview_report")
    .select(
      "id, role, role_title, stance, summary, role_description, created_at, interview_session_id, interview_sessions!inner(interview_configs!inner(bill_id))"
    )
    .eq("id", reportId);
  if (filter.isPublicByAdmin !== undefined) {
    query = query.eq("is_public_by_admin", filter.isPublicByAdmin);
  }
  if (filter.isPublicByUser !== undefined) {
    query = query.eq("is_public_by_user", filter.isPublicByUser);
  }
  if (filter.moderationStatus !== undefined) {
    query = query.eq("moderation_status", filter.moderationStatus);
  }
  const { data: report, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Failed to fetch respondent detail: ${error.message}`);
  }
  if (!report) return null;

  // k-匿名性ゲート（任意）: 公開レポートが少数の議案では会話ログを返さない（web と統一）。
  if (filter.requireDisplayThreshold) {
    const session = report.interview_sessions as unknown as {
      interview_configs: { bill_id: string } | null;
    } | null;
    const billId = session?.interview_configs?.bill_id ?? null;
    if (!billId) return null;
    const publicReportCount = await countPublicReportsByBillId(billId);
    if (!shouldDisplayPublicReports(publicReportCount)) return null;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("interview_messages")
    .select("id, role, content, created_at")
    .eq("interview_session_id", report.interview_session_id)
    .order("created_at", { ascending: true });
  if (messagesError) {
    throw new Error(`Failed to fetch transcript: ${messagesError.message}`);
  }

  return {
    report: {
      id: report.id,
      role: report.role,
      role_title: report.role_title,
      stance: report.stance,
      summary: report.summary,
      role_description: report.role_description,
      created_at: report.created_at,
    },
    // select 列が RawTranscriptMessageRow と一致するためそのまま渡す。
    messages: messages ?? [],
  };
}
