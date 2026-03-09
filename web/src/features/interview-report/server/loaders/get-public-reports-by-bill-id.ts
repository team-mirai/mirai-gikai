import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  countPublicReportsByBillId,
  findPublicReportsByBillId,
} from "../repositories/interview-report-repository";

const REVALIDATE_SECONDS = 600;

export type PublicInterviewReport = {
  id: string;
  stance: string | null;
  role: string | null;
  role_title: string | null;
  summary: string | null;
  total_score: number | null;
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
  return unstable_cache(
    async () => {
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
        total_score: r.total_score,
        created_at: r.created_at,
      }));

      return { reports, totalCount };
    },
    [`public-reports-${billId}`],
    {
      tags: [CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS],
      revalidate: REVALIDATE_SECONDS,
    }
  )();
}
