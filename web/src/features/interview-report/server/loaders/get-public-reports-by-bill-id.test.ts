import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countPublicReportsByBillId,
  findPublicReportsByBillId,
} from "../repositories/interview-report-repository";
import { getPublicReportsByBillId } from "./get-public-reports-by-bill-id";

vi.mock("server-only", () => ({}));

vi.mock("../repositories/interview-report-repository", () => ({
  countPublicReportsByBillId: vi.fn(),
  findPublicReportsByBillId: vi.fn(),
}));

const countPublicReportsByBillIdMock = vi.mocked(countPublicReportsByBillId);
const findPublicReportsByBillIdMock = vi.mocked(findPublicReportsByBillId);

type RawReport = Awaited<ReturnType<typeof findPublicReportsByBillId>>[number];

function createRawReport(id: string): RawReport {
  return {
    id,
    stance: "for",
    role: "general_citizen",
    role_title: "会社員",
    summary: `summary-${id}`,
    total_content_richness: 72,
    created_at: "2026-05-06T00:00:00.000Z",
  } as RawReport;
}

describe("getPublicReportsByBillId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開済み件数が表示閾値未満ならレポートを取得しない", async () => {
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1
    );

    const result = await getPublicReportsByBillId("bill-1");

    expect(result).toEqual({ reports: [], totalCount: 0 });
    expect(findPublicReportsByBillIdMock).not.toHaveBeenCalled();
  });

  it("公開済み件数が表示閾値以上なら最大3件と総件数を返す", async () => {
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );
    findPublicReportsByBillIdMock.mockResolvedValue([
      createRawReport("report-1"),
    ]);

    const result = await getPublicReportsByBillId("bill-1");

    expect(findPublicReportsByBillIdMock).toHaveBeenCalledWith("bill-1", 3);
    expect(result).toEqual({
      reports: [
        {
          id: "report-1",
          stance: "for",
          role: "general_citizen",
          role_title: "会社員",
          summary: "summary-report-1",
          total_content_richness: 72,
          created_at: "2026-05-06T00:00:00.000Z",
        },
      ],
      totalCount: MIN_PUBLIC_REPORTS_FOR_DISPLAY,
    });
  });
});
