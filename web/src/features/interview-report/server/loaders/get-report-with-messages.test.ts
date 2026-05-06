import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAuthenticatedUser,
  isSessionOwner,
} from "@/features/interview-session/server/utils/verify-session-ownership";
import {
  countPublicReportsByBillId,
  findBillWithContentById,
  findMessagesBySessionId,
  findReportWithSessionById,
} from "../repositories/interview-report-repository";
import { getReportWithMessages } from "./get-report-with-messages";

vi.mock("server-only", () => ({}));

vi.mock(
  "@/features/interview-session/server/utils/verify-session-ownership",
  () => ({
    getAuthenticatedUser: vi.fn(),
    isSessionOwner: vi.fn(),
  })
);

vi.mock("../repositories/interview-report-repository", () => ({
  countPublicReportsByBillId: vi.fn(),
  findBillWithContentById: vi.fn(),
  findMessagesBySessionId: vi.fn(),
  findReportWithSessionById: vi.fn(),
}));

const getAuthenticatedUserMock = vi.mocked(getAuthenticatedUser);
const isSessionOwnerMock = vi.mocked(isSessionOwner);
const countPublicReportsByBillIdMock = vi.mocked(countPublicReportsByBillId);
const findBillWithContentByIdMock = vi.mocked(findBillWithContentById);
const findMessagesBySessionIdMock = vi.mocked(findMessagesBySessionId);
const findReportWithSessionByIdMock = vi.mocked(findReportWithSessionById);

type ReportRow = Awaited<ReturnType<typeof findReportWithSessionById>>;
type BillRow = Awaited<ReturnType<typeof findBillWithContentById>>;
type MessageRow = Awaited<ReturnType<typeof findMessagesBySessionId>>[number];

function createReport(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: "report-1",
    interview_session_id: "session-1",
    is_public_by_admin: true,
    is_public_by_user: true,
    interview_sessions: {
      user_id: "owner-1",
      started_at: "2026-05-06T00:00:00.000Z",
      completed_at: "2026-05-06T01:00:00.000Z",
      interview_configs: { bill_id: "bill-1" },
    },
    ...overrides,
  } as ReportRow;
}

function arrangeReadableReport() {
  findMessagesBySessionIdMock.mockResolvedValue([
    { id: "message-1", role: "user", content: "hello" },
  ] as MessageRow[]);
  findBillWithContentByIdMock.mockResolvedValue({
    id: "bill-1",
    name: "議案名",
    thumbnail_url: null,
    share_thumbnail_url: null,
    bill_contents: [{ title: "議案タイトル" }],
  } as BillRow);
}

describe("getReportWithMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUserMock.mockResolvedValue({
      authenticated: false,
      error: "認証が必要です",
    });
    isSessionOwnerMock.mockReturnValue(false);
  });

  it("所有者でなく公開済み件数が表示閾値未満なら null を返す", async () => {
    findReportWithSessionByIdMock.mockResolvedValue(createReport());
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1
    );

    await expect(getReportWithMessages("report-1")).resolves.toBeNull();
    expect(findMessagesBySessionIdMock).not.toHaveBeenCalled();
    expect(findBillWithContentByIdMock).not.toHaveBeenCalled();
  });

  it("所有者なら公開件数ゲートを迂回してチャットログを返す", async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      authenticated: true,
      userId: "owner-1",
    });
    isSessionOwnerMock.mockReturnValue(true);
    findReportWithSessionByIdMock.mockResolvedValue(createReport());
    arrangeReadableReport();

    const result = await getReportWithMessages("report-1");

    expect(countPublicReportsByBillIdMock).not.toHaveBeenCalled();
    expect(result?.report.bill_id).toBe("bill-1");
    expect(result?.messages).toHaveLength(1);
  });

  it("所有者でなくても公開条件と表示件数を満たせばチャットログを返す", async () => {
    findReportWithSessionByIdMock.mockResolvedValue(createReport());
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );
    arrangeReadableReport();

    const result = await getReportWithMessages("report-1");

    expect(countPublicReportsByBillIdMock).toHaveBeenCalledWith("bill-1");
    expect(result?.bill.bill_content).toEqual({ title: "議案タイトル" });
  });
});
