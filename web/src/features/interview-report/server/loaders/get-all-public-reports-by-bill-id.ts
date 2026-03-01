import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { PublicInterviewReport } from "./get-public-reports-by-bill-id";
import { findPublicReportsByBillId } from "../repositories/interview-report-repository";

const REVALIDATE_SECONDS = 600;
const MAX_REPORTS = 1000;

/**
 * 議案IDから全ての公開インタビューレポートを取得
 */
export async function getAllPublicReportsByBillId(
  billId: string
): Promise<PublicInterviewReport[]> {
  return unstable_cache(
    async () => {
      const rawReports = await findPublicReportsByBillId(billId, MAX_REPORTS);
      return rawReports.map((r) => ({
        id: r.id,
        stance: r.stance,
        role: r.role,
        role_title: r.role_title,
        summary: r.summary,
        total_score: r.total_score,
        created_at: r.created_at,
      }));
    },
    [`all-public-reports-${billId}`],
    {
      tags: [CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS],
      revalidate: REVALIDATE_SECONDS,
    }
  )();
}
