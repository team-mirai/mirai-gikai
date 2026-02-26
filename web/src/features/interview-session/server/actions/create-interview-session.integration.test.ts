import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestBill,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import type { GetUserFn } from "../utils/verify-session-ownership";
import { createInterviewSessionCore } from "../services/create-interview-session-core";

function createGetUser(userId: string): GetUserFn {
  return async () => ({
    data: { user: { id: userId } },
    error: null,
  });
}

const getUnauthenticatedUser: GetUserFn = async () => ({
  data: { user: null },
  error: new Error("Not authenticated"),
});

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
  });

  afterEach(async () => {
    await cleanupTestBill(billId); // CASCADE で interview_configs, interview_sessions も削除
    await cleanupTestUser(testUser.id);
  });

  it("認証済みユーザーが新しいインタビューセッションを作成できる", async () => {
    const session = await createInterviewSessionCore({
      interviewConfigId: configId,
      deps: { getUser: createGetUser(testUser.id) },
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
    await expect(
      createInterviewSessionCore({
        interviewConfigId: configId,
        deps: { getUser: getUnauthenticatedUser },
      })
    ).rejects.toThrow("Failed to get user");
  });
});
