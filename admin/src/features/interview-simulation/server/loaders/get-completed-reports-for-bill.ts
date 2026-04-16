import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export interface CompletedReportListItem {
  sessionId: string;
  reportId: string;
  /** このレポートが属する config ID。UI で「現在の config のみ」フィルタに使う */
  configId: string;
  /** config 名。法案全体から選ぶとき、どの config のインタビューか判別する */
  configName: string | null;
  roleTitle: string | null;
  role: string | null;
  stance: string | null;
  summary: string | null;
  totalContentRichness: number | null;
  completedAt: string | null;
}

/**
 * 指定法案の「完了済みインタビュー + レポートあり」の一覧を取得する。
 *
 * シミュレーション画面で、編集中の config に紐づくものと法案全体のものの
 * 両方から選べるようにするため、bill_id で引いて config_id 情報も返す。
 * クライアント側で configId フィルタを切り替えられる設計。
 */
export async function getCompletedReportsForBill(
  billId: string
): Promise<CompletedReportListItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      "id, completed_at, interview_config_id, interview_configs!inner(name, bill_id), interview_report!inner(id, role, role_title, stance, summary, total_content_richness)"
    )
    .eq("interview_configs.bill_id", billId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch completed reports: ${error.message}`);
  }

  return (data ?? []).flatMap((session) => {
    const report = Array.isArray(session.interview_report)
      ? session.interview_report[0]
      : session.interview_report;
    const config = Array.isArray(session.interview_configs)
      ? session.interview_configs[0]
      : session.interview_configs;
    if (!report) return [];
    return [
      {
        sessionId: session.id,
        reportId: report.id,
        configId: session.interview_config_id,
        configName: config?.name ?? null,
        roleTitle: report.role_title ?? null,
        role: report.role ?? null,
        stance: report.stance ?? null,
        summary: report.summary ?? null,
        totalContentRichness: report.total_content_richness ?? null,
        completedAt: session.completed_at ?? null,
      },
    ];
  });
}
