import { createAdminClient } from "@mirai-gikai/supabase";
import {
  AUTO_PUBLISH_MAX_MODERATION_SCORE,
  AUTO_PUBLISH_MIN_CONTENT_RICHNESS,
} from "@mirai-gikai/shared/report-publication/auto-publish";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateReportPublicSetting } from "./interview-report-repository";

vi.mock("server-only", () => ({}));

vi.mock("@mirai-gikai/supabase", () => ({
  createAdminClient: vi.fn(),
}));

const createAdminClientMock = vi.mocked(createAdminClient);

type ReportForPublicSetting = {
  is_public_by_admin: boolean;
  moderation_score: number | null;
  total_content_richness: number | null;
};

function arrangePublicSettingQuery({
  fetchResult,
  updateResult = { error: null },
}: {
  fetchResult: {
    data: ReportForPublicSetting | null;
    error: { message: string } | null;
  };
  updateResult?: { error: { message: string } | null };
}) {
  const single = vi.fn().mockResolvedValue(fetchResult);
  const fetchEq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq: fetchEq }));
  const updateEq = vi.fn().mockResolvedValue(updateResult);
  const update = vi.fn(() => ({ eq: updateEq }));
  const from = vi
    .fn()
    .mockReturnValueOnce({ select })
    .mockReturnValueOnce({ update });
  createAdminClientMock.mockReturnValue({ from } as never);
  return { from, select, fetchEq, single, update, updateEq };
}

describe("updateReportPublicSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開許可時に自動公開条件を満たす未公開レポートを管理者公開にする", async () => {
    const query = arrangePublicSettingQuery({
      fetchResult: {
        data: {
          is_public_by_admin: false,
          moderation_score: AUTO_PUBLISH_MAX_MODERATION_SCORE,
          total_content_richness: AUTO_PUBLISH_MIN_CONTENT_RICHNESS,
        },
        error: null,
      },
    });

    await updateReportPublicSetting("report-1", true);

    expect(query.update).toHaveBeenCalledWith({
      is_public_by_user: true,
      is_public_by_admin: true,
    });
    expect(query.updateEq).toHaveBeenCalledWith("id", "report-1");
  });

  it("自動公開条件を満たさない場合はユーザー公開設定だけを更新する", async () => {
    const query = arrangePublicSettingQuery({
      fetchResult: {
        data: {
          is_public_by_admin: false,
          moderation_score: AUTO_PUBLISH_MAX_MODERATION_SCORE + 1,
          total_content_richness: AUTO_PUBLISH_MIN_CONTENT_RICHNESS,
        },
        error: null,
      },
    });

    await updateReportPublicSetting("report-1", true);

    expect(query.update).toHaveBeenCalledWith({
      is_public_by_user: true,
    });
  });

  it("公開設定更新前のレポート取得に失敗したらエラーにする", async () => {
    arrangePublicSettingQuery({
      fetchResult: {
        data: null,
        error: { message: "not found" },
      },
    });

    await expect(updateReportPublicSetting("report-1", true)).rejects.toThrow(
      "Failed to fetch report for public setting: not found"
    );
  });
});
