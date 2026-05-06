import { randomUUID } from "node:crypto";
import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "@test-utils/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getReportPublicStatus } from "./report-reaction-repository";

async function createTestInterviewConfig(billId: string) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({
      bill_id: billId,
      status: "public",
      name: `リアクション公開判定テスト ${Date.now()}`,
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
  configId: string,
  userId: string,
  overrides: Partial<{
    is_public_by_admin: boolean;
    is_public_by_user: boolean;
  }> = {}
) {
  const session = await createTestSession(configId, userId);
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: session.id,
      is_public_by_admin: overrides.is_public_by_admin ?? true,
      is_public_by_user: overrides.is_public_by_user ?? true,
      content_richness: { total: 70 },
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

async function createPublicReports(
  configId: string,
  userId: string,
  count: number
) {
  for (let index = 0; index < count; index++) {
    await createTestReport(configId, userId, {
      is_public_by_admin: true,
      is_public_by_user: true,
    });
  }
}

describe("getReportPublicStatus 統合テスト", () => {
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

  it("レポート取得に失敗したら false を返す", async () => {
    await expect(getReportPublicStatus(randomUUID())).resolves.toBe(false);
  });

  it("両公開フラグと表示件数ゲートを満たす場合だけ true を返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    const report = await createTestReport(config.id, testUser.id);
    await createPublicReports(
      config.id,
      testUser.id,
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1
    );

    await expect(getReportPublicStatus(report.id)).resolves.toBe(true);
  });

  it.each([
    { is_public_by_admin: false, is_public_by_user: true },
    { is_public_by_admin: true, is_public_by_user: false },
  ])("公開フラグが片側でも false なら false を返す (%o)", async ({
    is_public_by_admin,
    is_public_by_user,
  }) => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    const report = await createTestReport(config.id, testUser.id, {
      is_public_by_admin,
      is_public_by_user,
    });
    await createPublicReports(
      config.id,
      testUser.id,
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );

    await expect(getReportPublicStatus(report.id)).resolves.toBe(false);
  });

  it("公開済み件数が表示閾値未満なら false を返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    const report = await createTestReport(config.id, testUser.id);
    await createPublicReports(
      config.id,
      testUser.id,
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 2
    );

    await expect(getReportPublicStatus(report.id)).resolves.toBe(false);
  });
});
