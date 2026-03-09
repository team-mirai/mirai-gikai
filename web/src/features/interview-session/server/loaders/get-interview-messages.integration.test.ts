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
import { getInterviewMessages } from "./get-interview-messages";

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

describe("getInterviewMessages 統合テスト", () => {
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

  it("セッション所有者はメッセージ一覧を取得できる", async () => {
    await createTestInterviewMessages(sessionId, 3);

    const messages = await getInterviewMessages(sessionId, {
      getUser: createGetUser(testUser.id),
    });

    expect(messages).toHaveLength(3);
    expect(messages[0].interview_session_id).toBe(sessionId);
  });

  it("未認証の場合は空配列を返す", async () => {
    await createTestInterviewMessages(sessionId, 2);

    const messages = await getInterviewMessages(sessionId, {
      getUser: getUnauthenticatedUser,
    });

    expect(messages).toEqual([]);
  });

  it("セッションを所有していない別ユーザーは空配列を返す", async () => {
    const otherUser = await createTestUser();
    try {
      await createTestInterviewMessages(sessionId, 2);

      const messages = await getInterviewMessages(sessionId, {
        getUser: createGetUser(otherUser.id),
      });

      expect(messages).toEqual([]);
    } finally {
      await cleanupTestUser(otherUser.id);
    }
  });

  it("メッセージが存在しない場合は空配列を返す", async () => {
    const messages = await getInterviewMessages(sessionId, {
      getUser: createGetUser(testUser.id),
    });

    expect(messages).toEqual([]);
  });

  it("メッセージは作成順で返される", async () => {
    await adminClient.from("interview_messages").insert([
      {
        interview_session_id: sessionId,
        role: "assistant",
        content: "最初の質問",
      },
    ]);
    await adminClient.from("interview_messages").insert([
      {
        interview_session_id: sessionId,
        role: "user",
        content: "ユーザーの回答",
      },
    ]);

    const messages = await getInterviewMessages(sessionId, {
      getUser: createGetUser(testUser.id),
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe("最初の質問");
    expect(messages[1].content).toBe("ユーザーの回答");
  });
});
