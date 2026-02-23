import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  createTestInterviewMessages,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { getInterviewMessages } from "./get-interview-messages";

// getChatSupabaseUser はNext.js cookies依存のため差し替える
vi.mock("@/features/chat/server/utils/supabase-server", () => ({
  getChatSupabaseUser: vi.fn(),
  createChatSupabaseServerClient: vi.fn(),
}));

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

function mockAuthUser(userId: string) {
  vi.mocked(getChatSupabaseUser).mockResolvedValue({
    data: { user: { id: userId } as never },
    error: null,
  });
}

function mockUnauthenticated() {
  vi.mocked(getChatSupabaseUser).mockResolvedValue({
    data: { user: null },
    error: new Error("Not authenticated") as never,
  });
}

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
    vi.resetAllMocks();
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("セッション所有者はメッセージ一覧を取得できる", async () => {
    mockAuthUser(testUser.id);
    await createTestInterviewMessages(sessionId, 3);

    const messages = await getInterviewMessages(sessionId);

    expect(messages).toHaveLength(3);
    expect(messages[0].interview_session_id).toBe(sessionId);
  });

  it("未認証の場合は空配列を返す", async () => {
    mockUnauthenticated();
    await createTestInterviewMessages(sessionId, 2);

    const messages = await getInterviewMessages(sessionId);

    expect(messages).toEqual([]);
  });

  it("セッションを所有していない別ユーザーは空配列を返す", async () => {
    const otherUser = await createTestUser();
    mockAuthUser(otherUser.id);
    await createTestInterviewMessages(sessionId, 2);

    const messages = await getInterviewMessages(sessionId);

    expect(messages).toEqual([]);

    await cleanupTestUser(otherUser.id);
  });

  it("メッセージが存在しない場合は空配列を返す", async () => {
    mockAuthUser(testUser.id);

    const messages = await getInterviewMessages(sessionId);

    expect(messages).toEqual([]);
  });

  it("メッセージは作成順で返される", async () => {
    mockAuthUser(testUser.id);

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

    const messages = await getInterviewMessages(sessionId);

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe("最初の質問");
    expect(messages[1].content).toBe("ユーザーの回答");
  });
});
