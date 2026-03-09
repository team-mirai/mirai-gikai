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
import { createGenerateMock } from "@/test-utils/mock-language-model";
import type { GetUserFn } from "../utils/verify-session-ownership";
import { initializeInterviewChat } from "./initialize-interview-chat";

function createGetUser(userId: string): GetUserFn {
  return async () => ({
    data: { user: { id: userId } },
    error: null,
  });
}

// interviewChatTextSchema に準拠したモックレスポンス
// LLMのレスポンスはtopic_title: nullだが、overrideInitialTopicTitleにより「はじめに」に上書きされる
const llmResponse = JSON.stringify({
  text: "こんにちは！テストインタビューを始めましょう。最初の質問です。",
  quick_replies: ["はい", "いいえ"],
  question_id: null,
  topic_title: null,
  next_stage: "chat",
});
const expectedResponse = JSON.stringify({
  text: "こんにちは！テストインタビューを始めましょう。最初の質問です。",
  quick_replies: ["はい", "いいえ"],
  question_id: null,
  topic_title: "はじめに",
  next_stage: "chat",
});

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
    // メッセージを事前に作成してLLM呼び出しを回避する
    await createTestInterviewMessages(sessionId, 2);

    const result = await initializeInterviewChat(billId, interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result.session.id).toBe(sessionId);
    expect(result.session.interview_config_id).toBe(interviewConfigId);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].interview_session_id).toBe(sessionId);
  });

  it("セッションが存在しない場合は新しいセッションを作成する", async () => {
    const mockModel = createGenerateMock(llmResponse);

    // 既存セッションをアーカイブして「セッションなし」の状態にする
    await adminClient
      .from("interview_sessions")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", sessionId);

    const result = await initializeInterviewChat(billId, interviewConfigId, {
      getUser: createGetUser(testUser.id),
      model: mockModel,
    });

    // 新しいセッションが作成されていること
    expect(result.session.id).not.toBe(sessionId);
    expect(result.session.interview_config_id).toBe(interviewConfigId);
    expect(result.session.user_id).toBe(testUser.id);
    // MockModelが生成した初期質問メッセージが含まれること
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("assistant");
    expect(result.messages[0].content).toBe(expectedResponse);
  });
});
