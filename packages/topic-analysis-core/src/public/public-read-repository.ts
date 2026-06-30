import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
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
 * 議案の「公開中（is_published=true）」のトピック分析を生データで取得する。
 * §8 の表示時フィルタに必要な interview_report 属性（公開同意・モデレーション・role）も
 * 相乗して返す。フィルタ・集計は純粋関数 buildPublicTopicAnalysis 側で行う。
 *
 * 公開中 version が無ければ null（呼び出し側で「準備中」扱い）。
 */
export async function findPublishedAnalysis(
  billId: string
): Promise<PublishedAnalysisData | null> {
  const supabase = createAdminClient();

  // bill ごと公開は最大1版（one_published_per_bill）。
  const { data: version, error: versionError } = await supabase
    .from("topic_analysis_version")
    .select("id, version, completed_at")
    .eq("bill_id", billId)
    .eq("is_published", true)
    .maybeSingle();
  if (versionError) {
    throw new Error(
      `Failed to fetch published version: ${versionError.message}`
    );
  }
  if (!version) return null;

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
 * 議案に紐づく公開レポート（回答者）を全件取得する。
 * 公開レポート（管理者公開 × ユーザー公開）と同一基準でフィルタし、
 * 回答一覧（回答者1人=1カード）で使用する。新しい回答が上に来るよう降順。
 */
export async function findPublicBillRespondentRows(
  billId: string
): Promise<RawRespondentRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_report")
    .select(
      `id, role, role_title, stance, summary, created_at,
       interview_sessions!inner(interview_configs!inner(bill_id))`
    )
    .eq("interview_sessions.interview_configs.bill_id", billId)
    .eq("is_public_by_admin", true)
    .eq("is_public_by_user", true)
    .order("created_at", { ascending: false });
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

export type RespondentDetailData = {
  report: RawRespondentDetailRow;
  messages: RawTranscriptMessageRow[];
};

/**
 * 議案の公開レポート件数を数える（web の countPublicReportsByBillId と同一定義）。
 * k-匿名性しきい値（shouldDisplayPublicReports）の判定に使う。
 */
async function countPublicReportsByBillId(billId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("interview_report")
    .select("id, interview_sessions!inner(interview_configs!inner(bill_id))", {
      count: "exact",
      head: true,
    })
    .eq("is_public_by_admin", true)
    .eq("is_public_by_user", true)
    .eq("interview_sessions.interview_configs.bill_id", billId);
  if (error) {
    throw new Error(`Failed to count public reports: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * 公開レポート1件の詳細（立場説明＋会話ログ）を生データで取得する。
 * 回答一覧と同一基準（管理者公開×ユーザー公開）でフィルタし、加えて
 * **web の個別レポート詳細（getPublicReportById）と同じ k-匿名性ゲート**
 * （公開レポートが `shouldDisplayPublicReports` を満たす＝20件以上）を適用する。
 * 件数未満・非公開・存在しない場合は null（呼び出し側で not_found 扱い）。
 * 会話メッセージは作成日時昇順。
 */
export async function findPublicRespondentDetail(
  reportId: string
): Promise<RespondentDetailData | null> {
  const supabase = createAdminClient();

  const { data: report, error } = await supabase
    .from("interview_report")
    .select(
      "id, role, role_title, stance, summary, role_description, created_at, interview_session_id, interview_sessions!inner(interview_configs!inner(bill_id))"
    )
    .eq("id", reportId)
    .eq("is_public_by_admin", true)
    .eq("is_public_by_user", true)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to fetch respondent detail: ${error.message}`);
  }
  if (!report) return null;

  // k-匿名性ゲート: 公開レポートが少数の議案では会話ログを返さない（web と統一）。
  // これにより get_public_topic_analysis(interview_report_id) → detail のピボットも塞ぐ。
  const session = report.interview_sessions as unknown as {
    interview_configs: { bill_id: string } | null;
  } | null;
  const billId = session?.interview_configs?.bill_id ?? null;
  if (!billId) return null;
  const publicReportCount = await countPublicReportsByBillId(billId);
  if (!shouldDisplayPublicReports(publicReportCount)) return null;

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
