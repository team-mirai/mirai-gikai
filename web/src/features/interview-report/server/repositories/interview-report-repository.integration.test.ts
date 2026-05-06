import { randomUUID } from "node:crypto";
import {
  AUTO_PUBLISH_MAX_MODERATION_SCORE,
  AUTO_PUBLISH_MIN_CONTENT_RICHNESS,
} from "@mirai-gikai/shared/report-publication/auto-publish";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "@test-utils/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { updateReportPublicSetting } from "./interview-report-repository";

async function createTestInterviewConfig(billId: string) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({
      bill_id: billId,
      status: "public",
      name: `公開設定テスト ${Date.now()}`,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);
  return data;
}

async function createTestSession(configId: string, userId: string) {
  const { data, error } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`interview_session 作成失敗: ${error.message}`);
  return data;
}

async function createTestReport(
  sessionId: string,
  overrides: Partial<{
    is_public_by_admin: boolean;
    is_public_by_user: boolean;
    moderation_score: number | null;
    contentRichnessTotal: number | null;
  }> = {}
) {
  const contentRichnessTotal = overrides.contentRichnessTotal ?? null;
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      is_public_by_admin: overrides.is_public_by_admin ?? false,
      is_public_by_user: overrides.is_public_by_user ?? false,
      moderation_score: overrides.moderation_score ?? null,
      content_richness:
        contentRichnessTotal == null ? null : { total: contentRichnessTotal },
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

async function createReportFixture(
  userId: string,
  overrides: Parameters<typeof createTestReport>[1]
) {
  const bill = await createTestBill();
  try {
    const config = await createTestInterviewConfig(bill.id);
    const session = await createTestSession(config.id, userId);
    const report = await createTestReport(session.id, overrides);
    return { bill, report };
  } catch (error) {
    await cleanupTestBill(bill.id);
    throw error;
  }
}

async function findPublicFlags(reportId: string) {
  const { data, error } = await adminClient
    .from("interview_report")
    .select("is_public_by_user, is_public_by_admin")
    .eq("id", reportId)
    .single();
  expect(error).toBeNull();
  return data;
}

describe("updateReportPublicSetting 統合テスト", () => {
  let testUser: TestUser;
  const billIds: string[] = [];

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    const billCleanupResults = await Promise.allSettled(
      billIds.map((billId) => cleanupTestBill(billId))
    );
    billIds.length = 0;
    const userCleanupResults = await Promise.allSettled([
      cleanupTestUser(testUser.id),
    ]);
    const rejected = [...billCleanupResults, ...userCleanupResults].filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );
    if (rejected.length > 0) {
      throw new Error(
        `テストデータのクリーンアップに失敗しました: ${rejected
          .map((result) => String(result.reason))
          .join(", ")}`
      );
    }
  });

  it("公開許可時に自動公開条件を満たす未公開レポートを管理者公開にする", async () => {
    const { bill, report } = await createReportFixture(testUser.id, {
      is_public_by_admin: false,
      is_public_by_user: false,
      moderation_score: AUTO_PUBLISH_MAX_MODERATION_SCORE,
      contentRichnessTotal: AUTO_PUBLISH_MIN_CONTENT_RICHNESS,
    });
    billIds.push(bill.id);

    await updateReportPublicSetting(report.id, true);

    await expect(findPublicFlags(report.id)).resolves.toEqual({
      is_public_by_user: true,
      is_public_by_admin: true,
    });
  });

  it("自動公開条件を満たさない場合はユーザー公開設定だけを更新する", async () => {
    const { bill, report } = await createReportFixture(testUser.id, {
      is_public_by_admin: false,
      is_public_by_user: false,
      moderation_score: AUTO_PUBLISH_MAX_MODERATION_SCORE + 1,
      contentRichnessTotal: AUTO_PUBLISH_MIN_CONTENT_RICHNESS,
    });
    billIds.push(bill.id);

    await updateReportPublicSetting(report.id, true);

    await expect(findPublicFlags(report.id)).resolves.toEqual({
      is_public_by_user: true,
      is_public_by_admin: false,
    });
  });

  it("公開設定更新前のレポート取得に失敗したらエラーにする", async () => {
    await expect(updateReportPublicSetting(randomUUID(), true)).rejects.toThrow(
      "Failed to fetch report for public setting:"
    );
  });
});
