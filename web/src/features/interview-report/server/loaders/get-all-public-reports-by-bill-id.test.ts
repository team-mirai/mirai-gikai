import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countPublicReportsByStance,
  findPublicReportsByBillId,
} from "../repositories/interview-report-repository";
import {
  PAGE_SIZE,
  getInitialPublicReportsByBillId,
  getPublicReportsByBillIdPaginated,
} from "./get-all-public-reports-by-bill-id";

vi.mock("server-only", () => ({}));

vi.mock("../repositories/interview-report-repository", () => ({
  countPublicReportsByStance: vi.fn(),
  findPublicReportsByBillId: vi.fn(),
}));

const countPublicReportsByStanceMock = vi.mocked(countPublicReportsByStance);
const findPublicReportsByBillIdMock = vi.mocked(findPublicReportsByBillId);

type RawReport = Awaited<ReturnType<typeof findPublicReportsByBillId>>[number];
type StanceRow = Awaited<ReturnType<typeof countPublicReportsByStance>>[number];

function createRawReport(index: number): RawReport {
  return {
    id: `report-${index}`,
    stance: "for",
    role: "general_citizen",
    role_title: "会社員",
    summary: `summary-${index}`,
    total_content_richness: 70 + index,
    created_at: "2026-05-06T00:00:00.000Z",
  } as RawReport;
}

function stanceRow(stance: string | null, count: number): StanceRow {
  return { stance, count } as StanceRow;
}

describe("getInitialPublicReportsByBillId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開済み件数が表示閾値未満なら空の初期ページを返す", async () => {
    countPublicReportsByStanceMock.mockResolvedValue([
      stanceRow("for", MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1),
    ]);

    const result = await getInitialPublicReportsByBillId("bill-1");

    expect(result).toEqual({
      reports: [],
      stanceCounts: { all: 0, for: 0, against: 0, neutral: 0 },
      hasMore: false,
    });
    expect(findPublicReportsByBillIdMock).not.toHaveBeenCalled();
  });

  it("公開済み件数が表示閾値以上なら集計と初期ページを返す", async () => {
    const rawReports = Array.from({ length: PAGE_SIZE + 1 }, (_, index) =>
      createRawReport(index + 1)
    );
    countPublicReportsByStanceMock.mockResolvedValue([
      stanceRow("for", 12),
      stanceRow("against", 5),
      stanceRow(null, 3),
    ]);
    findPublicReportsByBillIdMock.mockResolvedValue(rawReports);

    const result = await getInitialPublicReportsByBillId(
      "bill-1",
      "for",
      "newest"
    );

    expect(findPublicReportsByBillIdMock).toHaveBeenCalledWith(
      "bill-1",
      PAGE_SIZE + 1,
      0,
      "for",
      "newest"
    );
    expect(result.hasMore).toBe(true);
    expect(result.reports).toHaveLength(PAGE_SIZE);
    expect(result.stanceCounts).toEqual({
      all: MIN_PUBLIC_REPORTS_FOR_DISPLAY,
      for: 12,
      against: 5,
      neutral: 0,
    });
  });
});

describe("getPublicReportsByBillIdPaginated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開済み件数が表示閾値未満ならページネーション結果を返さない", async () => {
    countPublicReportsByStanceMock.mockResolvedValue([
      stanceRow("neutral", MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1),
    ]);

    const result = await getPublicReportsByBillIdPaginated("bill-1", 20);

    expect(result).toEqual({ reports: [], hasMore: false });
    expect(findPublicReportsByBillIdMock).not.toHaveBeenCalled();
  });

  it("表示可能なら指定条件で次ページを取得する", async () => {
    countPublicReportsByStanceMock.mockResolvedValue([
      stanceRow("for", MIN_PUBLIC_REPORTS_FOR_DISPLAY),
    ]);
    findPublicReportsByBillIdMock.mockResolvedValue([createRawReport(1)]);

    const result = await getPublicReportsByBillIdPaginated(
      "bill-1",
      20,
      "for",
      "newest"
    );

    expect(findPublicReportsByBillIdMock).toHaveBeenCalledWith(
      "bill-1",
      PAGE_SIZE + 1,
      20,
      "for",
      "newest"
    );
    expect(result).toEqual({
      reports: [
        {
          id: "report-1",
          stance: "for",
          role: "general_citizen",
          role_title: "会社員",
          summary: "summary-1",
          total_content_richness: 71,
          created_at: "2026-05-06T00:00:00.000Z",
        },
      ],
      hasMore: false,
    });
  });
});
