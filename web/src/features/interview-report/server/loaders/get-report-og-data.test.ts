import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countPublicReportsByBillId,
  findBillWithContentById,
  findPublicReportWithSessionById,
} from "../repositories/interview-report-repository";
import { getReportOgData } from "./get-report-og-data";

vi.mock("server-only", () => ({}));

vi.mock("../repositories/interview-report-repository", () => ({
  countPublicReportsByBillId: vi.fn(),
  findBillWithContentById: vi.fn(),
  findPublicReportWithSessionById: vi.fn(),
}));

const countPublicReportsByBillIdMock = vi.mocked(countPublicReportsByBillId);
const findBillWithContentByIdMock = vi.mocked(findBillWithContentById);
const findPublicReportWithSessionByIdMock = vi.mocked(
  findPublicReportWithSessionById
);

type PublicReportRow = Awaited<
  ReturnType<typeof findPublicReportWithSessionById>
>;
type BillRow = Awaited<ReturnType<typeof findBillWithContentById>>;

function createPublicReport(): PublicReportRow {
  return {
    id: "report-1",
    summary: "レポート要約",
    interview_sessions: {
      started_at: "2026-05-06T00:00:00.000Z",
      completed_at: "2026-05-06T01:00:00.000Z",
      interview_configs: { bill_id: "bill-1" },
    },
  } as PublicReportRow;
}

describe("getReportOgData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開済み件数が表示閾値未満なら null を返す", async () => {
    findPublicReportWithSessionByIdMock.mockResolvedValue(createPublicReport());
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1
    );

    await expect(getReportOgData("report-1")).resolves.toBeNull();
    expect(findBillWithContentByIdMock).not.toHaveBeenCalled();
  });

  it("表示可能な公開レポートなら OGP データを返す", async () => {
    findPublicReportWithSessionByIdMock.mockResolvedValue(createPublicReport());
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );
    findBillWithContentByIdMock.mockResolvedValue({
      id: "bill-1",
      name: "議案名",
      thumbnail_url: null,
      share_thumbnail_url: null,
      bill_contents: [{ title: "議案タイトル" }],
    } as BillRow);

    await expect(getReportOgData("report-1")).resolves.toEqual({
      summary: "レポート要約",
      billName: "議案タイトル",
    });
  });
});
