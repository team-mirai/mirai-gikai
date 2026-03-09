import { describe, expect, it } from "vitest";
import type { ReportCardData } from "../components/report-card";
import { countReportsByStance, filterReportsByStance } from "./stance-filter";

const reports: ReportCardData[] = [
  {
    id: "1",
    stance: "for",
    role: null,
    role_title: null,
    summary: "期待",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "2",
    stance: "against",
    role: null,
    role_title: null,
    summary: "懸念",
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "3",
    stance: "neutral",
    role: null,
    role_title: null,
    summary: "両方",
    created_at: "2026-01-03T00:00:00Z",
  },
  {
    id: "4",
    stance: "for",
    role: null,
    role_title: null,
    summary: "期待2",
    created_at: "2026-01-04T00:00:00Z",
  },
];

describe("filterReportsByStance", () => {
  it("allフィルターは全レポートを返す", () => {
    expect(filterReportsByStance(reports, "all")).toHaveLength(4);
  });

  it("forフィルターは期待レポートのみ返す", () => {
    const result = filterReportsByStance(reports, "for");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.stance === "for")).toBe(true);
  });

  it("againstフィルターは懸念レポートのみ返す", () => {
    const result = filterReportsByStance(reports, "against");
    expect(result).toHaveLength(1);
    expect(result[0].stance).toBe("against");
  });

  it("neutralフィルターは両方レポートのみ返す", () => {
    const result = filterReportsByStance(reports, "neutral");
    expect(result).toHaveLength(1);
    expect(result[0].stance).toBe("neutral");
  });
});

describe("countReportsByStance", () => {
  it("スタンスごとの件数を正しく計算する", () => {
    const counts = countReportsByStance(reports);
    expect(counts).toEqual({
      all: 4,
      for: 2,
      against: 1,
      neutral: 1,
    });
  });

  it("空配列は全て0を返す", () => {
    const counts = countReportsByStance([]);
    expect(counts).toEqual({
      all: 0,
      for: 0,
      against: 0,
      neutral: 0,
    });
  });
});
