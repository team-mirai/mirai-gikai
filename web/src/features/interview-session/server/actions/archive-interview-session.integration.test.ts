import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { archiveInterviewSession } from "./archive-interview-session";

// getChatSupabaseUser は next/headers に依存するためモック
vi.mock("@/features/chat/server/utils/supabase-server", () => ({
  getChatSupabaseUser: vi.fn(),
}));

// next/headers のモック
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ getAll: () => [], setAll: () => {} })),
}));

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

describe("archiveInterviewSession 統合テスト", () => {
  let testUser: TestUser;
  let sessionId: string;
  let billId: string;

  beforeEach(async () => {
    testUser = await createTestUser();
    const data = await createTestInterviewData(testUser.id);
    sessionId = data.session.id;
    billId = data.bill.id;

    // 認証済みユーザーとしてテストユーザーを返す
    vi.mocked(getChatSupabaseUser).mockResolvedValue({
      data: {
        user: {
          id: testUser.id,
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    } as Awaited<ReturnType<typeof getChatSupabaseUser>>);
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
    vi.resetAllMocks();
  });

  it("セッションオーナーがアーカイブに成功する", async () => {
    const result = await archiveInterviewSession(sessionId);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // DB でセッションが archived_at を持つことを確認
    const { data: dbSession } = await adminClient
      .from("interview_sessions")
      .select("archived_at")
      .eq("id", sessionId)
      .single();

    expect(dbSession?.archived_at).toBeTruthy();
  });

  it("未認証ユーザーはアーカイブできない", async () => {
    vi.mocked(getChatSupabaseUser).mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated", name: "AuthError", status: 401 },
    } as Awaited<ReturnType<typeof getChatSupabaseUser>>);

    const result = await archiveInterviewSession(sessionId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("認証が必要です");

    // DB でセッションが変更されていないことを確認
    const { data: dbSession } = await adminClient
      .from("interview_sessions")
      .select("archived_at")
      .eq("id", sessionId)
      .single();

    expect(dbSession?.archived_at).toBeNull();
  });

  it("別ユーザーは他ユーザーのセッションをアーカイブできない", async () => {
    // 別のテストユーザーを作成
    const anotherUser = await createTestUser();

    // 別ユーザーとして認証
    vi.mocked(getChatSupabaseUser).mockResolvedValue({
      data: {
        user: {
          id: anotherUser.id,
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    } as Awaited<ReturnType<typeof getChatSupabaseUser>>);

    const result = await archiveInterviewSession(sessionId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("このセッションへのアクセス権限がありません");

    // DB でセッションが変更されていないことを確認
    const { data: dbSession } = await adminClient
      .from("interview_sessions")
      .select("archived_at")
      .eq("id", sessionId)
      .single();

    expect(dbSession?.archived_at).toBeNull();

    await cleanupTestUser(anotherUser.id);
  });

  it("存在しないセッションIDではアーカイブできない", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const result = await archiveInterviewSession(nonExistentId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("セッションが見つかりません");
  });
});
