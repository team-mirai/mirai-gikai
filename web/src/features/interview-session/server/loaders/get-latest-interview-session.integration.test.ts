import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { getLatestInterviewSession } from "./get-latest-interview-session";

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

describe("getLatestInterviewSession 統合テスト", () => {
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

  it("進行中セッションを active として返す", async () => {
    mockAuthUser(testUser.id);

    const result = await getLatestInterviewSession(interviewConfigId);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(sessionId);
    expect(result?.status).toBe("active");
    expect(result?.reportId).toBeNull();
  });

  it("完了済みセッションを completed として返す", async () => {
    mockAuthUser(testUser.id);

    await adminClient
      .from("interview_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    const result = await getLatestInterviewSession(interviewConfigId);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(sessionId);
    expect(result?.status).toBe("completed");
  });

  it("未認証の場合はnullを返す", async () => {
    mockUnauthenticated();

    const result = await getLatestInterviewSession(interviewConfigId);

    expect(result).toBeNull();
  });

  it("セッションが存在しない場合はnullを返す", async () => {
    mockAuthUser(testUser.id);

    const result = await getLatestInterviewSession(
      "00000000-0000-0000-0000-000000000000"
    );

    expect(result).toBeNull();
  });

  it("アーカイブ済みセッションはnullを返す", async () => {
    mockAuthUser(testUser.id);

    await adminClient
      .from("interview_sessions")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", sessionId);

    const result = await getLatestInterviewSession(interviewConfigId);

    expect(result).toBeNull();
  });

  it("複数セッションがある場合は最新を返す", async () => {
    mockAuthUser(testUser.id);

    // 古いセッションをアーカイブして新しいセッションを作成
    await adminClient
      .from("interview_sessions")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", sessionId);

    const { data: newSession } = await adminClient
      .from("interview_sessions")
      .insert({
        interview_config_id: interviewConfigId,
        user_id: testUser.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const result = await getLatestInterviewSession(interviewConfigId);

    expect(result?.id).toBe(newSession?.id);
    expect(result?.status).toBe("active");
  });
});
