import type { ReportCardData } from "../components/report-card";

export type StanceFilter = "all" | "for" | "against" | "neutral";

export const stanceFilterLabels: Record<StanceFilter, string> = {
  all: "ALL",
  for: "期待",
  against: "懸念",
  neutral: "期待&懸念",
};

export const stanceFilterOrder: StanceFilter[] = [
  "all",
  "for",
  "against",
  "neutral",
];

/**
 * スタンスフィルターに基づいてレポートをフィルタリング
 */
export function filterReportsByStance(
  reports: ReportCardData[],
  filter: StanceFilter
): ReportCardData[] {
  if (filter === "all") return reports;
  return reports.filter((r) => r.stance === filter);
}

/**
 * スタンスごとの件数を計算
 */
export function countReportsByStance(
  reports: ReportCardData[]
): Record<StanceFilter, number> {
  const counts: Record<StanceFilter, number> = {
    all: reports.length,
    for: 0,
    against: 0,
    neutral: 0,
  };

  for (const report of reports) {
    if (report.stance === "for") counts.for++;
    else if (report.stance === "against") counts.against++;
    else if (report.stance === "neutral") counts.neutral++;
  }

  return counts;
}
