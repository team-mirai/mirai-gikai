import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import type { SortOrder } from "../../shared/utils/sort-order";
import type {
  StanceCounts,
  StanceFilter,
} from "../../shared/utils/stance-filter";
import {
  countPublicReportsByStance,
  findPublicReportsByBillId,
} from "../repositories/interview-report-repository";
import type { PublicInterviewReport } from "./get-public-reports-by-bill-id";

export const PAGE_SIZE = 20;

export type PaginatedPublicReportsResult = {
  reports: PublicInterviewReport[];
  stanceCounts: StanceCounts;
  hasMore: boolean;
};

const emptyStanceCounts: StanceCounts = {
  all: 0,
  for: 0,
  against: 0,
  neutral: 0,
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
  billId: string,
  stance: StanceFilter = "all",
  sortOrder: SortOrder = "recommended"
): Promise<PaginatedPublicReportsResult> {
  const stanceParam = stance === "all" ? undefined : stance;
  const stanceRows = await countPublicReportsByStance(billId);

  const stanceCounts: StanceCounts = {
    all: 0,
    for: 0,
    against: 0,
    neutral: 0,
  };
  for (const row of stanceRows) {
    const key = row.stance as StanceFilter | null;
    if (key && key in stanceCounts && key !== "all") {
      stanceCounts[key] = Number(row.count);
    }
    // null stance を含む全件を all に加算
    stanceCounts.all += Number(row.count);
  }

  if (!shouldDisplayPublicReports(stanceCounts.all)) {
    return {
      reports: [],
      stanceCounts: { ...emptyStanceCounts },
      hasMore: false,
    };
  }

  const rawReports = await findPublicReportsByBillId(
    billId,
    PAGE_SIZE + 1,
    0,
    stanceParam,
    sortOrder
  );
  const hasMore = rawReports.length > PAGE_SIZE;
  const reports = mapRawReports(
    hasMore ? rawReports.slice(0, PAGE_SIZE) : rawReports
  );

  return { reports, stanceCounts, hasMore };
}

/**
 * ページネーション用: 次のページのレポートを取得
 */
export async function getPublicReportsByBillIdPaginated(
  billId: string,
  offset: number,
  stance: StanceFilter = "all",
  sortOrder: SortOrder = "recommended"
): Promise<{ reports: PublicInterviewReport[]; hasMore: boolean }> {
  const stanceRows = await countPublicReportsByStance(billId);
  const totalCount = stanceRows.reduce(
    (sum, row) => sum + Number(row.count),
    0
  );
  if (!shouldDisplayPublicReports(totalCount)) {
    return { reports: [], hasMore: false };
  }

  const stanceParam = stance === "all" ? undefined : stance;
  const rawReports = await findPublicReportsByBillId(
    billId,
    PAGE_SIZE + 1,
    offset,
    stanceParam,
    sortOrder
  );

  const hasMore = rawReports.length > PAGE_SIZE;
  const reports = mapRawReports(
    hasMore ? rawReports.slice(0, PAGE_SIZE) : rawReports
  );

  return { reports, hasMore };
}
