import "server-only";

import {
  countPublicReportsByBillId,
  findPublicReportsByBillId,
} from "../repositories/interview-report-repository";

export type PublicInterviewReport = {
  id: string;
  stance: string | null;
  role: string | null;
  role_title: string | null;
  summary: string | null;
  total_content_richness: number | null;
  created_at: string;
};

export type PublicReportsResult = {
  reports: PublicInterviewReport[];
  totalCount: number;
};

/**
 * 議案IDから公開インタビューレポート（最大3件）と総件数を取得
 */
export async function getPublicReportsByBillId(
  billId: string
): Promise<PublicReportsResult> {
  const [rawReports, totalCount] = await Promise.all([
    findPublicReportsByBillId(billId, 3),
    countPublicReportsByBillId(billId),
  ]);

  const reports: PublicInterviewReport[] = rawReports.map((r) => ({
    id: r.id,
    stance: r.stance,
    role: r.role,
    role_title: r.role_title,
    summary: r.summary,
    total_content_richness: r.total_content_richness,
    created_at: r.created_at,
  }));

  return { reports, totalCount };
}
