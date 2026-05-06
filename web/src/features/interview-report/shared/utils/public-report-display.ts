import { isPublicReportVisible } from "@mirai-gikai/shared/report-publication/auto-publish";
import type { StanceCounts, StanceFilter } from "./stance-filter";

export type RawPublicInterviewReport = {
  id: string;
  stance: string | null;
  role: string | null;
  role_title: string | null;
  summary: string | null;
  total_content_richness: number | null;
  created_at: string;
};

export type PublicInterviewReportDisplay = RawPublicInterviewReport;

export type PublicReportStanceCountRow = {
  stance: string | null;
  count: number | string | bigint;
};

export type PublicReportSessionLike = {
  started_at: string;
  completed_at: string | null;
  interview_configs: { bill_id: string } | null;
} | null;

type BillContentLike = { title: string };

export function createEmptyStanceCounts(): StanceCounts {
  return {
    all: 0,
    for: 0,
    against: 0,
    neutral: 0,
  };
}

export function mapPublicInterviewReports(
  rawReports: RawPublicInterviewReport[]
): PublicInterviewReportDisplay[] {
  return rawReports.map((report) => ({
    id: report.id,
    stance: report.stance,
    role: report.role,
    role_title: report.role_title,
    summary: report.summary,
    total_content_richness: report.total_content_richness,
    created_at: report.created_at,
  }));
}

export function buildStanceCounts(
  stanceRows: PublicReportStanceCountRow[]
): StanceCounts {
  const stanceCounts = createEmptyStanceCounts();

  for (const row of stanceRows) {
    const key = row.stance as StanceFilter | null;
    const count = Number(row.count);
    if (key && key in stanceCounts && key !== "all") {
      stanceCounts[key] = count;
    }
    stanceCounts.all += count;
  }

  return stanceCounts;
}

export function buildPublicReportsPage(
  rawReports: RawPublicInterviewReport[],
  pageSize: number
) {
  const hasMore = rawReports.length > pageSize;
  return {
    reports: mapPublicInterviewReports(
      hasMore ? rawReports.slice(0, pageSize) : rawReports
    ),
    hasMore,
  };
}

export function getBillIdFromPublicReportSession(
  session: PublicReportSessionLike
) {
  return session?.interview_configs?.bill_id ?? null;
}

export function selectPrimaryBillContent<T extends BillContentLike>(
  billContents: T | T[] | null
) {
  if (!billContents) return null;
  return Array.isArray(billContents) ? (billContents[0] ?? null) : billContents;
}

export function countUserMessageCharacters(
  messages: { role: string; content: string }[]
) {
  return messages
    .filter((message) => message.role === "user")
    .reduce((sum, message) => sum + message.content.length, 0);
}

export function canViewReportWithMessages({
  isOwner,
  isPublicByAdmin,
  isPublicByUser,
  publicReportCount,
}: {
  isOwner: boolean;
  isPublicByAdmin: boolean;
  isPublicByUser: boolean;
  publicReportCount: number;
}) {
  if (isOwner) return true;
  return isPublicReportVisible({
    isPublicByAdmin,
    isPublicByUser,
    publicReportCount,
  });
}
