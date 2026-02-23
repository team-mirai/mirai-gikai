import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { getInterviewSessionById } from "./get-interview-session-by-id";

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

describe("getInterviewSessionById 統合テスト", () => {
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

  it("セッション所有者はセッション詳細（bill_id付き）を取得できる", async () => {
    mockAuthUser(testUser.id);

    const session = await getInterviewSessionById(sessionId);

    expect(session).not.toBeNull();
    expect(session?.id).toBe(sessionId);
    expect(session?.user_id).toBe(testUser.id);
    expect(session?.bill_id).toBe(billId);
    expect(session?.interview_config_id).toBe(interviewConfigId);
  });

  it("未認証の場合はnullを返す", async () => {
    mockUnauthenticated();

    const session = await getInterviewSessionById(sessionId);

    expect(session).toBeNull();
  });

  it("セッションを所有していない別ユーザーはnullを返す", async () => {
    const otherUser = await createTestUser();
    mockAuthUser(otherUser.id);

    const session = await getInterviewSessionById(sessionId);

    expect(session).toBeNull();

    await cleanupTestUser(otherUser.id);
  });

  it("存在しないセッションIDはnullを返す", async () => {
    mockAuthUser(testUser.id);

    const session = await getInterviewSessionById(
      "00000000-0000-0000-0000-000000000000"
    );

    expect(session).toBeNull();
  });

  it("完了済みセッションも取得できる", async () => {
    mockAuthUser(testUser.id);

    // セッションを完了状態にする
    await adminClient
      .from("interview_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    const session = await getInterviewSessionById(sessionId);

    expect(session).not.toBeNull();
    expect(session?.completed_at).not.toBeNull();
  });
});
