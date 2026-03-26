import "server-only";

import type {
  StanceCounts,
  StanceFilter,
} from "../../shared/utils/stance-filter";
import type { PublicInterviewReport } from "./get-public-reports-by-bill-id";
import {
  countPublicReportsByStance,
  findPublicReportsByBillId,
} from "../repositories/interview-report-repository";

export const PAGE_SIZE = 20;

export type PaginatedPublicReportsResult = {
  reports: PublicInterviewReport[];
  stanceCounts: StanceCounts;
  hasMore: boolean;
};

function mapRawReports(
  rawReports: Awaited<ReturnType<typeof findPublicReportsByBillId>>
): PublicInterviewReport[] {
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

/**
 * 議案IDから公開インタビューレポートの初回ページとスタンスごとの件数を取得
 */
export async function getInitialPublicReportsByBillId(
  billId: string
): Promise<PaginatedPublicReportsResult> {
  const [rawReports, stanceRows] = await Promise.all([
    findPublicReportsByBillId(billId, PAGE_SIZE + 1),
    countPublicReportsByStance(billId),
  ]);

  const hasMore = rawReports.length > PAGE_SIZE;
  const reports = mapRawReports(
    hasMore ? rawReports.slice(0, PAGE_SIZE) : rawReports
  );

  const stanceCounts: StanceCounts = {
    all: 0,
    for: 0,
    against: 0,
    neutral: 0,
  };
  for (const row of stanceRows) {
    const key = row.stance as StanceFilter;
    if (key in stanceCounts && key !== "all") {
      stanceCounts[key] = Number(row.count);
    }
    // null stance を含む全件を all に加算
    stanceCounts.all += Number(row.count);
  }

  return { reports, stanceCounts, hasMore };
}

/**
 * ページネーション用: 次のページのレポートを取得
 */
export async function getPublicReportsByBillIdPaginated(
  billId: string,
  offset: number,
  stance: StanceFilter = "all"
): Promise<{ reports: PublicInterviewReport[]; hasMore: boolean }> {
  const stanceParam = stance === "all" ? undefined : stance;
  const rawReports = await findPublicReportsByBillId(
    billId,
    PAGE_SIZE + 1,
    offset,
    stanceParam
  );

  const hasMore = rawReports.length > PAGE_SIZE;
  const reports = mapRawReports(
    hasMore ? rawReports.slice(0, PAGE_SIZE) : rawReports
  );

  return { reports, hasMore };
}
