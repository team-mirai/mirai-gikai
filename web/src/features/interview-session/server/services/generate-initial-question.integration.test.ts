import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { createGenerateMock } from "@/test-utils/mock-language-model";
import { generateInitialQuestion } from "./generate-initial-question";

// interviewChatTextSchema に準拠したモックレスポンス
const validChatResponse = JSON.stringify({
  text: "こんにちは！テストインタビューを始めましょう。最初の質問です。",
  quick_replies: ["はい", "いいえ"],
  question_id: null,
  topic_title: null,
  next_stage: "chat",
});

describe("generateInitialQuestion 統合テスト", () => {
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

  it("LLMが生成したテキストがassistantメッセージとしてDBに保存される", async () => {
    const mockModel = createGenerateMock(validChatResponse);

    const result = await generateInitialQuestion({
      sessionId,
      billId,
      interviewConfigId,
      deps: { model: mockModel },
    });

    // 戻り値を検証
    expect(result).not.toBeNull();
    expect(result?.role).toBe("assistant");
    expect(result?.content).toBe(validChatResponse);

    // DB 状態を検証: assistantメッセージが保存されていること
    const { data: messages } = await adminClient
      .from("interview_messages")
      .select("*")
      .eq("interview_session_id", sessionId)
      .order("created_at", { ascending: true });

    expect(messages).toHaveLength(1);
    expect(messages?.[0].role).toBe("assistant");
    expect(messages?.[0].content).toBe(validChatResponse);
    expect(messages?.[0].interview_session_id).toBe(sessionId);
  });

  it("LLMが空テキストを返した場合はnullを返しDBに保存されない", async () => {
    const mockModel = createGenerateMock("  "); // 空白のみ

    const result = await generateInitialQuestion({
      sessionId,
      billId,
      interviewConfigId,
      deps: { model: mockModel },
    });

    // null が返ること
    expect(result).toBeNull();

    // DB 状態を検証: メッセージが保存されていないこと
    const { data: messages } = await adminClient
      .from("interview_messages")
      .select("*")
      .eq("interview_session_id", sessionId);

    expect(messages).toHaveLength(0);
  });

  it("interview_configが存在しないbillIdの場合はnullを返す", async () => {
    // 存在しないbillId
    const nonExistentBillId = "00000000-0000-0000-0000-000000000000";
    const mockModel = createGenerateMock(validChatResponse);

    const result = await generateInitialQuestion({
      sessionId,
      billId: nonExistentBillId,
      interviewConfigId,
      deps: { model: mockModel },
    });

    // interview_config が見つからないためnullが返ること
    expect(result).toBeNull();
  });
});
