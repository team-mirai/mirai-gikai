import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import type { GetUserFn } from "../utils/verify-session-ownership";
import { archiveInterviewSessionCore } from "../services/archive-interview-session-core";

function createGetUser(userId: string): GetUserFn {
  return async () => ({
    data: { user: { id: userId } },
    error: null,
  });
}

const getUnauthenticatedUser: GetUserFn = async () => ({
  data: { user: null },
  error: new Error("Not authenticated"),
});

describe("archiveInterviewSession 統合テスト", () => {
  let testUser: TestUser;
  let sessionId: string;
  let billId: string;

  beforeEach(async () => {
    testUser = await createTestUser();
    const data = await createTestInterviewData(testUser.id);
    sessionId = data.session.id;
    billId = data.bill.id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("セッションオーナーがアーカイブに成功する", async () => {
    const result = await archiveInterviewSessionCore(sessionId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // DB でセッションが archived_at を持つことを確認
    const { data: dbSession } = await adminClient
      .from("interview_sessions")
      .select("archived_at")
      .eq("id", sessionId)
      .single();

    expect(dbSession?.archived_at).toBeTruthy();
  });

  it("未認証ユーザーはアーカイブできない", async () => {
    const result = await archiveInterviewSessionCore(sessionId, {
      getUser: getUnauthenticatedUser,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("認証が必要です");

    // DB でセッションが変更されていないことを確認
    const { data: dbSession } = await adminClient
      .from("interview_sessions")
      .select("archived_at")
      .eq("id", sessionId)
      .single();

    expect(dbSession?.archived_at).toBeNull();
  });

  it("別ユーザーは他ユーザーのセッションをアーカイブできない", async () => {
    const anotherUser = await createTestUser();
    try {
      const result = await archiveInterviewSessionCore(sessionId, {
        getUser: createGetUser(anotherUser.id),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("このセッションへのアクセス権限がありません");

      // DB でセッションが変更されていないことを確認
      const { data: dbSession } = await adminClient
        .from("interview_sessions")
        .select("archived_at")
        .eq("id", sessionId)
        .single();

      expect(dbSession?.archived_at).toBeNull();
    } finally {
      await cleanupTestUser(anotherUser.id);
    }
  });

  it("存在しないセッションIDではアーカイブできない", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const result = await archiveInterviewSessionCore(nonExistentId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("セッションが見つかりません");
  });
});
