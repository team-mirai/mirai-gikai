import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  PublishedVersionMeta,
  RawOpinionRow,
  RawRespondentRow,
  RawTopicRow,
} from "../../shared/types";

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
