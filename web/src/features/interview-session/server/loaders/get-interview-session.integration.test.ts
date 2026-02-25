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
import { getInterviewSession } from "./get-interview-session";

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

describe("getInterviewSession 統合テスト", () => {
  let testUser: TestUser;
  let sessionId: string;
  let billId: string;
  let interviewConfigId: string;

  beforeEach(async () => {
    testUser = await createTestUser();
    const data = await createTestInterviewData(testUser.id);
    sessionId = data.session.id;
    billId = data.bill.id;
    interviewConfigId = data.config.id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("アクティブなセッションを取得できる", async () => {
    const session = await getInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(session).not.toBeNull();
    expect(session?.id).toBe(sessionId);
    expect(session?.interview_config_id).toBe(interviewConfigId);
    expect(session?.user_id).toBe(testUser.id);
    expect(session?.completed_at).toBeNull();
    expect(session?.archived_at).toBeNull();
  });

  it("未認証の場合はnullを返す", async () => {
    const session = await getInterviewSession(interviewConfigId, {
      getUser: getUnauthenticatedUser,
    });

    expect(session).toBeNull();
  });

  it("セッションが存在しない場合はnullを返す", async () => {
    const session = await getInterviewSession(
      "00000000-0000-0000-0000-000000000000",
      { getUser: createGetUser(testUser.id) }
    );

    expect(session).toBeNull();
  });

  it("完了済みセッションはnullを返す（アクティブのみ取得）", async () => {
    await adminClient
      .from("interview_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    const session = await getInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(session).toBeNull();
  });

  it("別ユーザーのセッションはnullを返す", async () => {
    const otherUser = await createTestUser();
    try {
      const session = await getInterviewSession(interviewConfigId, {
        getUser: createGetUser(otherUser.id),
      });

      expect(session).toBeNull();
    } finally {
      await cleanupTestUser(otherUser.id);
    }
  });
});
