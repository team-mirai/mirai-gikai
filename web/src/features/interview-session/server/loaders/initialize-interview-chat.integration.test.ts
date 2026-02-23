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

// getChatSupabaseUser はNext.js cookies依存のため差し替える
vi.mock("@/features/chat/server/utils/supabase-server", () => ({
  getChatSupabaseUser: vi.fn(),
  createChatSupabaseServerClient: vi.fn(),
}));

// generateInitialQuestion はLLM依存のため差し替える
vi.mock(
  "@/features/interview-session/server/services/generate-initial-question",
  () => ({
    generateInitialQuestion: vi.fn().mockResolvedValue(null),
  })
);

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import { initializeInterviewChat } from "./initialize-interview-chat";

function mockAuthUser(userId: string) {
  vi.mocked(getChatSupabaseUser).mockResolvedValue({
    data: { user: { id: userId } as never },
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
    vi.resetAllMocks();
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("既存セッションとメッセージをそのまま返す", async () => {
    mockAuthUser(testUser.id);

    // メッセージを事前に作成してLLM呼び出しを回避する
    await createTestInterviewMessages(sessionId, 2);

    const result = await initializeInterviewChat(billId, interviewConfigId);

    expect(result.session.id).toBe(sessionId);
    expect(result.session.interview_config_id).toBe(interviewConfigId);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].interview_session_id).toBe(sessionId);
  });

  it("セッションが存在しない場合は新しいセッションを作成する", async () => {
    mockAuthUser(testUser.id);

    // 既存セッションをアーカイブして「セッションなし」の状態にする
    await adminClient
      .from("interview_sessions")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", sessionId);

    const result = await initializeInterviewChat(billId, interviewConfigId);

    // 新しいセッションが作成されていること
    expect(result.session.id).not.toBe(sessionId);
    expect(result.session.interview_config_id).toBe(interviewConfigId);
    expect(result.session.user_id).toBe(testUser.id);
    // generateInitialQuestionがnullを返すためメッセージなし
    expect(result.messages).toHaveLength(0);
  });
});
