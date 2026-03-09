import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { saveInterviewMessage } from "./save-interview-message";

describe("saveInterviewMessage 統合テスト", () => {
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

  it("メッセージを DB に保存できる", async () => {
    await saveInterviewMessage({
      sessionId,
      role: "user",
      content: "テストメッセージです",
    });

    // DB 状態を検証
    const { data } = await adminClient
      .from("interview_messages")
      .select("*")
      .eq("interview_session_id", sessionId)
      .order("created_at", { ascending: true });

    expect(data).toHaveLength(1);
    expect(data?.[0].role).toBe("user");
    expect(data?.[0].content).toBe("テストメッセージです");
  });

  it("assistant メッセージも保存できる", async () => {
    await saveInterviewMessage({
      sessionId,
      role: "assistant",
      content: "AIからの応答です",
    });

    const { data } = await adminClient
      .from("interview_messages")
      .select("role, content")
      .eq("interview_session_id", sessionId)
      .single();

    expect(data?.role).toBe("assistant");
    expect(data?.content).toBe("AIからの応答です");
  });

  it("リトライ時は user メッセージの保存をスキップする", async () => {
    await saveInterviewMessage({
      sessionId,
      role: "user",
      content: "スキップされるべきメッセージ",
      isRetry: true,
    });

    // DB にメッセージが追加されていないことを検証
    const { data } = await adminClient
      .from("interview_messages")
      .select("*")
      .eq("interview_session_id", sessionId);

    expect(data).toHaveLength(0);
  });

  it("リトライ時でも assistant メッセージは保存される", async () => {
    await saveInterviewMessage({
      sessionId,
      role: "assistant",
      content: "リトライ時のAI応答",
      isRetry: true,
    });

    const { data } = await adminClient
      .from("interview_messages")
      .select("*")
      .eq("interview_session_id", sessionId);

    expect(data).toHaveLength(1);
    expect(data?.[0].content).toBe("リトライ時のAI応答");
  });
});
