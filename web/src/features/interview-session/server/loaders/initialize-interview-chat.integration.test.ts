import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  createTestInterviewMessages,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import type { GetUserFn } from "../utils/verify-session-ownership";
import { initializeInterviewChat } from "./initialize-interview-chat";

function createGetUser(userId: string): GetUserFn {
  return async () => ({
    data: { user: { id: userId } },
    error: null,
  });
}

describe("initializeInterviewChat 統合テスト", () => {
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

  it("既存セッションとメッセージをそのまま返す", async () => {
    // メッセージを事前に作成
    await createTestInterviewMessages(sessionId, 2);

    const result = await initializeInterviewChat(billId, interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result.session.id).toBe(sessionId);
    expect(result.session.interview_config_id).toBe(interviewConfigId);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].interview_session_id).toBe(sessionId);
  });

  it("セッションが存在しない場合は新しいセッションを作成し空メッセージを返す", async () => {
    // 既存セッションをアーカイブして「セッションなし」の状態にする
    await adminClient
      .from("interview_sessions")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", sessionId);

    const result = await initializeInterviewChat(billId, interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    // 新しいセッションが作成されていること
    expect(result.session.id).not.toBe(sessionId);
    expect(result.session.interview_config_id).toBe(interviewConfigId);
    expect(result.session.user_id).toBe(testUser.id);
    // 初回質問はクライアント側でAPIから取得するため、メッセージは空
    expect(result.messages).toHaveLength(0);
  });
});
