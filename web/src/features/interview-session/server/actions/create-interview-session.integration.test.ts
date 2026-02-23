import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestBill,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { createInterviewSession } from "./create-interview-session";

// getChatSupabaseUser は next/headers に依存するためモック
vi.mock("@/features/chat/server/utils/supabase-server", () => ({
  getChatSupabaseUser: vi.fn(),
}));

// next/headers のモック（server-only環境でのcookies()呼び出し回避）
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ getAll: () => [], setAll: () => {} })),
}));

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

describe("createInterviewSession 統合テスト", () => {
  let testUser: TestUser;
  let billId: string;
  let configId: string;

  beforeEach(async () => {
    testUser = await createTestUser();

    const bill = await createTestBill();
    billId = bill.id;

    const { data: config, error: configError } = await adminClient
      .from("interview_configs")
      .insert({
        bill_id: billId,
        status: "public",
        name: `テスト設定 ${Date.now()}`,
      })
      .select()
      .single();
    if (configError || !config) {
      throw new Error(`interview_config 作成失敗: ${configError?.message}`);
    }
    configId = config.id;

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
    await cleanupTestBill(billId); // CASCADE で interview_configs, interview_sessions も削除
    await cleanupTestUser(testUser.id);
    vi.resetAllMocks();
  });

  it("認証済みユーザーが新しいインタビューセッションを作成できる", async () => {
    const session = await createInterviewSession({
      interviewConfigId: configId,
    });

    expect(session).toBeDefined();
    expect(session.interview_config_id).toBe(configId);
    expect(session.user_id).toBe(testUser.id);
    expect(session.started_at).toBeTruthy();
    expect(session.completed_at).toBeNull();
    expect(session.archived_at).toBeNull();

    // DB にセッションが保存されていることを確認
    const { data: dbSession } = await adminClient
      .from("interview_sessions")
      .select("*")
      .eq("id", session.id)
      .single();

    expect(dbSession).toBeTruthy();
    expect(dbSession?.user_id).toBe(testUser.id);
    expect(dbSession?.interview_config_id).toBe(configId);
  });

  it("認証失敗時はエラーを throw する", async () => {
    vi.mocked(getChatSupabaseUser).mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated", name: "AuthError", status: 401 },
    } as Awaited<ReturnType<typeof getChatSupabaseUser>>);

    await expect(
      createInterviewSession({ interviewConfigId: configId })
    ).rejects.toThrow("Failed to get user");
  });
});
