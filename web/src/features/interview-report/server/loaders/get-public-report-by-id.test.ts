import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countPublicReportsByBillId,
  findBillWithContentById,
  findMessagesBySessionId,
  findPublicReportWithSessionById,
} from "../repositories/interview-report-repository";
import { getPublicReportById } from "./get-public-report-by-id";

vi.mock("server-only", () => ({}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

vi.mock("../repositories/interview-report-repository", () => ({
  countPublicReportsByBillId: vi.fn(),
  findBillWithContentById: vi.fn(),
  findMessagesBySessionId: vi.fn(),
  findPublicReportWithSessionById: vi.fn(),
}));

const countPublicReportsByBillIdMock = vi.mocked(countPublicReportsByBillId);
const findBillWithContentByIdMock = vi.mocked(findBillWithContentById);
const findMessagesBySessionIdMock = vi.mocked(findMessagesBySessionId);
const findPublicReportWithSessionByIdMock = vi.mocked(
  findPublicReportWithSessionById
);

type PublicReportRow = Awaited<
  ReturnType<typeof findPublicReportWithSessionById>
>;
type BillRow = Awaited<ReturnType<typeof findBillWithContentById>>;
type MessageRow = Awaited<ReturnType<typeof findMessagesBySessionId>>[number];

function createPublicReport(overrides: Partial<PublicReportRow> = {}) {
  return {
    id: "report-1",
    interview_session_id: "session-1",
    summary: "公開レポート",
    interview_sessions: {
      started_at: "2026-05-06T00:00:00.000Z",
      completed_at: "2026-05-06T01:00:00.000Z",
      interview_configs: { bill_id: "bill-1" },
    },
    ...overrides,
  } as PublicReportRow;
}

describe("getPublicReportById", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("公開済み件数が表示閾値未満なら null を返す", async () => {
    findPublicReportWithSessionByIdMock.mockResolvedValue(createPublicReport());
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1
    );

    await expect(getPublicReportById("report-1")).resolves.toBeNull();
    expect(findBillWithContentByIdMock).not.toHaveBeenCalled();
    expect(findMessagesBySessionIdMock).not.toHaveBeenCalled();
  });

  it("セッションに議案が紐づいていなければ null を返す", async () => {
    findPublicReportWithSessionByIdMock.mockResolvedValue(
      createPublicReport({
        interview_sessions: {
          started_at: "2026-05-06T00:00:00.000Z",
          completed_at: null,
          interview_configs: null,
        } as unknown as PublicReportRow["interview_sessions"],
      })
    );

    await expect(
      getPublicReportById("report-without-bill")
    ).resolves.toBeNull();
    expect(countPublicReportsByBillIdMock).not.toHaveBeenCalled();
  });

  it("表示可能な公開レポートとユーザー文字数を返す", async () => {
    findPublicReportWithSessionByIdMock.mockResolvedValue(createPublicReport());
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );
    findBillWithContentByIdMock.mockResolvedValue({
      id: "bill-1",
      name: "議案名",
      thumbnail_url: null,
      share_thumbnail_url: "https://example.com/share.png",
      bill_contents: { title: "議案タイトル" },
    } as unknown as BillRow);
    findMessagesBySessionIdMock.mockResolvedValue([
      { role: "user", content: "abc" },
      { role: "assistant", content: "ignored" },
      { role: "user", content: "de" },
    ] as MessageRow[]);

    const result = await getPublicReportById("report-1");

    expect(result?.bill_id).toBe("bill-1");
    expect(result?.bill.bill_content).toEqual({ title: "議案タイトル" });
    expect(result?.characterCount).toBe(5);
  });
});
