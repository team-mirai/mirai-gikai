import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { CompletedReportListItem } from "../../shared/types";

/**
 * シミュレーション画面の Select 候補として取得する上限。
 * 完了済みインタビューはUIドロップダウンで選ばせる想定なので、大量だと
 * スクロール困難で操作性を損なう。運用上 300 件を超えるケースは稀。
 * 上限に達した場合は `isTruncated=true` を返し、呼び出し側で警告表示する。
 */
const MAX_REPORTS_FOR_SIMULATION = 300;

export interface CompletedReportsForBillResult {
  reports: CompletedReportListItem[];
  /** true なら MAX_REPORTS_FOR_SIMULATION で切り詰められている */
  isTruncated: boolean;
  /** UI 警告用の上限値 */
  limit: number;
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
): Promise<CompletedReportsForBillResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      "id, completed_at, interview_config_id, interview_configs!inner(name, bill_id), interview_report!inner(id, role, role_title, stance, summary, total_content_richness)"
    )
    .eq("interview_configs.bill_id", billId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(MAX_REPORTS_FOR_SIMULATION + 1);

  if (error) {
    throw new Error(`Failed to fetch completed reports: ${error.message}`);
  }

  const rows = data ?? [];
  // +1 件取って超過判定。超過時は配列を MAX 件に切り詰めて返す
  const isTruncated = rows.length > MAX_REPORTS_FOR_SIMULATION;
  const visibleRows = isTruncated
    ? rows.slice(0, MAX_REPORTS_FOR_SIMULATION)
    : rows;

  const reports: CompletedReportListItem[] = visibleRows.flatMap((session) => {
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

  return { reports, isTruncated, limit: MAX_REPORTS_FOR_SIMULATION };
}
