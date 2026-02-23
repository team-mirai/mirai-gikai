import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { getInterviewSession } from "./get-interview-session";

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
    vi.resetAllMocks();
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("アクティブなセッションを取得できる", async () => {
    mockAuthUser(testUser.id);

    const session = await getInterviewSession(interviewConfigId);

    expect(session).not.toBeNull();
    expect(session?.id).toBe(sessionId);
    expect(session?.interview_config_id).toBe(interviewConfigId);
    expect(session?.user_id).toBe(testUser.id);
    expect(session?.completed_at).toBeNull();
    expect(session?.archived_at).toBeNull();
  });

  it("未認証の場合はnullを返す", async () => {
    mockUnauthenticated();

    const session = await getInterviewSession(interviewConfigId);

    expect(session).toBeNull();
  });

  it("セッションが存在しない場合はnullを返す", async () => {
    mockAuthUser(testUser.id);

    const session = await getInterviewSession(
      "00000000-0000-0000-0000-000000000000"
    );

    expect(session).toBeNull();
  });

  it("完了済みセッションはnullを返す（アクティブのみ取得）", async () => {
    mockAuthUser(testUser.id);

    await adminClient
      .from("interview_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    const session = await getInterviewSession(interviewConfigId);

    expect(session).toBeNull();
  });

  it("別ユーザーのセッションはnullを返す", async () => {
    const otherUser = await createTestUser();
    mockAuthUser(otherUser.id);

    const session = await getInterviewSession(interviewConfigId);

    expect(session).toBeNull();

    await cleanupTestUser(otherUser.id);
  });
});
