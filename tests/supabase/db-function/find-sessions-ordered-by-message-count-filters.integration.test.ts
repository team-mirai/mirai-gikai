import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestBill,
  createTestInterviewMessages,
  cleanupTestBill,
  type TestUser,
} from "../utils";

async function createTestInterviewConfig(billId: string) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({
      bill_id: billId,
      status: "public",
      name: `テスト設定 ${Date.now()}`,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);
  return data;
}

let sessionCounter = 0;

async function createTestSession(
  configId: string,
  userId: string,
  completedAt?: string
) {
  sessionCounter++;
  const startedAt = new Date(Date.now() - sessionCounter * 1000).toISOString();
  const { data, error } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: configId,
      user_id: userId,
      started_at: startedAt,
      completed_at: completedAt ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_session 作成失敗: ${error.message}`);
  return data;
}

async function createTestReport(
  sessionId: string,
  overrides: {
    stance?: string;
    role?: string;
    is_public_by_admin?: boolean;
    total_content_richness?: number;
  } = {}
) {
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      stance: overrides.stance ?? "for",
      role: overrides.role ?? "general_citizen",
      is_public_by_admin: overrides.is_public_by_admin ?? false,
      content_richness: { total: overrides.total_content_richness ?? 50 },
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

describe("find_sessions_ordered_by_message_count() フィルタパラメータ", () => {
  let testUser: TestUser;
  const billIds: string[] = [];

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
    await cleanupTestUser(testUser.id);
  });

  it("p_statusでcompletedセッションのみフィルタできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const completed = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(completed.id, 3);

    const inProgress = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(inProgress.id, 5);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
        p_status: "completed",
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].session_id).toBe(completed.id);
  });

  it("p_stanceでスタンスフィルタできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s1.id, 3);
    await createTestReport(s1.id, { stance: "for" });

    const s2 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s2.id, 5);
    await createTestReport(s2.id, { stance: "against" });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
        p_stance: "for",
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].session_id).toBe(s1.id);
  });

  it("p_visibilityで公開状態フィルタできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s1.id, 2);
    await createTestReport(s1.id, { is_public_by_admin: true });

    const s2 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s2.id, 4);
    await createTestReport(s2.id, { is_public_by_admin: false });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
        p_visibility: "public",
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].session_id).toBe(s1.id);
  });

  it("p_roleで役割フィルタできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s1.id, 3);
    await createTestReport(s1.id, { role: "subject_expert" });

    const s2 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s2.id, 1);
    await createTestReport(s2.id, { role: "general_citizen" });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
        p_role: "subject_expert",
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].session_id).toBe(s1.id);
  });

  it("複数フィルタを組み合わせて絞り込める", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s1.id, 5);
    await createTestReport(s1.id, { stance: "for", is_public_by_admin: true });

    const s2 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s2.id, 3);
    await createTestReport(s2.id, {
      stance: "for",
      is_public_by_admin: false,
    });

    const s3 = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestInterviewMessages(s3.id, 7);
    await createTestReport(s3.id, {
      stance: "against",
      is_public_by_admin: true,
    });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
        p_status: "completed",
        p_stance: "for",
        p_visibility: "public",
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].session_id).toBe(s1.id);
  });

  it("フィルタパラメータがNULLの場合はフィルタしない（既存動作と同等）", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(s1.id, 2);

    const s2 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(s2.id, 4);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });
});
