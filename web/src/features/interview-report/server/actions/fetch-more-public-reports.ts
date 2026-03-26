"use server";

import { z } from "zod";
import { getReportReactionsBatch } from "@/features/report-reaction/server/loaders/get-report-reactions";
import type { PublicInterviewReport } from "../loaders/get-public-reports-by-bill-id";
import { getPublicReportsByBillIdPaginated } from "../loaders/get-all-public-reports-by-bill-id";
import type { StanceFilter } from "../../shared/utils/stance-filter";

const inputSchema = z.object({
  billId: z.string().uuid(),
  offset: z.number().int().min(0),
  stance: z.enum(["all", "for", "against", "neutral"]).default("all"),
});

export type FetchMoreReportsResult = {
  reports: PublicInterviewReport[];
  reactionsRecord: Record<
    string,
    { counts: { helpful: number; hmm: number }; userReaction: string | null }
  >;
  hasMore: boolean;
};

/**
 * スクロールページネーション用: 次のページの公開レポートとリアクションを取得
 */
export async function fetchMorePublicReports(
  billId: string,
  offset: number,
  stance: StanceFilter = "all"
): Promise<FetchMoreReportsResult> {
  const parsed = inputSchema.safeParse({ billId, offset, stance });
  if (!parsed.success) {
    return { reports: [], reactionsRecord: {}, hasMore: false };
  }

  const { reports, hasMore } = await getPublicReportsByBillIdPaginated(
    parsed.data.billId,
    parsed.data.offset,
    parsed.data.stance
  );

  const reportIds = reports.map((r) => r.id);
  const reactionsMap = await getReportReactionsBatch(reportIds);
  const reactionsRecord: FetchMoreReportsResult["reactionsRecord"] = {};
  for (const [id, data] of reactionsMap) {
    reactionsRecord[id] = {
      counts: data.counts,
      userReaction: data.userReaction,
    };
  }

  return { reports, reactionsRecord, hasMore };
}
