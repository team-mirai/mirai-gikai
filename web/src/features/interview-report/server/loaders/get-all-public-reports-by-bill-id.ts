import "server-only";

import type { PublicInterviewReport } from "./get-public-reports-by-bill-id";
import { findPublicReportsByBillId } from "../repositories/interview-report-repository";

const MAX_REPORTS = 1000;

/**
 * 議案IDから全ての公開インタビューレポートを取得
 */
export async function getAllPublicReportsByBillId(
  billId: string
): Promise<PublicInterviewReport[]> {
  const rawReports = await findPublicReportsByBillId(billId, MAX_REPORTS);
  return rawReports.map((r) => ({
    id: r.id,
    stance: r.stance,
    role: r.role,
    role_title: r.role_title,
    summary: r.summary,
    total_content_richness: r.total_content_richness,
    created_at: r.created_at,
  }));
}
