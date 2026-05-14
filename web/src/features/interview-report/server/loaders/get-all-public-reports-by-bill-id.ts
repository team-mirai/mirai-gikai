import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import type { SortOrder } from "../../shared/utils/sort-order";
import type {
  StanceCounts,
  StanceFilter,
} from "../../shared/utils/stance-filter";
import {
  buildPublicReportsPage,
  buildStanceCounts,
  createEmptyStanceCounts,
} from "../../shared/utils/public-report-display";
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
  const stanceCounts = buildStanceCounts(stanceRows);

  if (!shouldDisplayPublicReports(stanceCounts.all)) {
    return {
      reports: [],
      stanceCounts: createEmptyStanceCounts(),
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
  const { reports, hasMore } = buildPublicReportsPage(rawReports, PAGE_SIZE);

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
  const { reports, hasMore } = buildPublicReportsPage(rawReports, PAGE_SIZE);

  return { reports, hasMore };
}
