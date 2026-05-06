import { createAdminClient } from "@mirai-gikai/supabase";
import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { countPublicReportsByBillId } from "@/features/interview-report/server/repositories/interview-report-repository";
import { getReportPublicStatus } from "./report-reaction-repository";

vi.mock("server-only", () => ({}));

vi.mock("@mirai-gikai/supabase", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock(
  "@/features/interview-report/server/repositories/interview-report-repository",
  () => ({
    countPublicReportsByBillId: vi.fn(),
  })
);

const createAdminClientMock = vi.mocked(createAdminClient);
const countPublicReportsByBillIdMock = vi.mocked(countPublicReportsByBillId);

type ReportPublicStatusResult = {
  data: {
    is_public_by_admin: boolean;
    is_public_by_user: boolean;
    interview_sessions: {
      interview_configs: { bill_id: string } | null;
    } | null;
  } | null;
  error: { message: string } | null;
};

function arrangeReportQuery(result: ReportPublicStatusResult) {
  const single = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  createAdminClientMock.mockReturnValue({ from } as never);
  return { from, select, eq, single };
}

describe("getReportPublicStatus", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("レポート取得に失敗したら false を返す", async () => {
    arrangeReportQuery({ data: null, error: { message: "not found" } });

    await expect(getReportPublicStatus("report-1")).resolves.toBe(false);
    expect(countPublicReportsByBillIdMock).not.toHaveBeenCalled();
  });

  it("議案IDを解決できなければ false を返す", async () => {
    arrangeReportQuery({
      data: {
        is_public_by_admin: true,
        is_public_by_user: true,
        interview_sessions: { interview_configs: null },
      },
      error: null,
    });

    await expect(getReportPublicStatus("report-1")).resolves.toBe(false);
    expect(countPublicReportsByBillIdMock).not.toHaveBeenCalled();
  });

  it("両公開フラグと表示件数ゲートを満たす場合だけ true を返す", async () => {
    const query = arrangeReportQuery({
      data: {
        is_public_by_admin: true,
        is_public_by_user: true,
        interview_sessions: {
          interview_configs: { bill_id: "bill-1" },
        },
      },
      error: null,
    });
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );

    await expect(getReportPublicStatus("report-1")).resolves.toBe(true);
    expect(query.from).toHaveBeenCalledWith("interview_report");
    expect(query.select).toHaveBeenCalledWith(
      "is_public_by_admin, is_public_by_user, interview_sessions!inner(interview_configs!inner(bill_id))"
    );
    expect(query.eq).toHaveBeenCalledWith("id", "report-1");
    expect(countPublicReportsByBillIdMock).toHaveBeenCalledWith("bill-1");
  });

  it.each([
    { is_public_by_admin: false, is_public_by_user: true },
    { is_public_by_admin: true, is_public_by_user: false },
  ])("公開フラグが片側でも false なら false を返す (%o)", async ({
    is_public_by_admin,
    is_public_by_user,
  }) => {
    arrangeReportQuery({
      data: {
        is_public_by_admin,
        is_public_by_user,
        interview_sessions: {
          interview_configs: { bill_id: "bill-1" },
        },
      },
      error: null,
    });
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );

    await expect(getReportPublicStatus("report-1")).resolves.toBe(false);
  });

  it("公開済み件数が表示閾値未満なら false を返す", async () => {
    arrangeReportQuery({
      data: {
        is_public_by_admin: true,
        is_public_by_user: true,
        interview_sessions: {
          interview_configs: { bill_id: "bill-1" },
        },
      },
      error: null,
    });
    countPublicReportsByBillIdMock.mockResolvedValue(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1
    );

    await expect(getReportPublicStatus("report-1")).resolves.toBe(false);
  });
});
