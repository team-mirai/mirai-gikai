import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestBill,
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
  // テスト内で作成順序を保証するため、started_atをずらす
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

describe("find_sessions_ordered_by_total_content_richness() 関数", () => {
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

  it("充実度の降順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, { total_content_richness: 30 });

    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, { total_content_richness: 80 });

    const s3 = await createTestSession(config.id, testUser.id);
    await createTestReport(s3.id, { total_content_richness: 50 });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data![0].session_id).toBe(s2.id);
    expect(data![1].session_id).toBe(s3.id);
    expect(data![2].session_id).toBe(s1.id);
  });

  it("充実度の昇順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, { total_content_richness: 70 });

    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, { total_content_richness: 20 });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
      {
        p_config_id: config.id,
        p_ascending: true,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(s2.id);
    expect(data![1].session_id).toBe(s1.id);
  });

  it("p_statusでフィルタできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const completed = await createTestSession(
      config.id,
      testUser.id,
      new Date().toISOString()
    );
    await createTestReport(completed.id, { total_content_richness: 60 });

    const inProgress = await createTestSession(config.id, testUser.id);
    await createTestReport(inProgress.id, { total_content_richness: 90 });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
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

  it("p_stanceでフィルタできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, {
      total_content_richness: 40,
      stance: "neutral",
    });

    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, {
      total_content_richness: 80,
      stance: "for",
    });

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
        p_stance: "neutral",
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].session_id).toBe(s1.id);
  });

  it("offset/limitでページネーションが正しく動作する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const sessions = [];
    for (let i = 0; i < 5; i++) {
      const s = await createTestSession(config.id, testUser.id);
      await createTestReport(s.id, { total_content_richness: (i + 1) * 20 });
      sessions.push(s);
    }

    // 降順: 100, 80, 60, 40, 20 → offset=1, limit=2 → 80, 60
    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 1,
        p_limit: 2,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(sessions[3].id); // content_richness 80
    expect(data![1].session_id).toBe(sessions[2].id); // content_richness 60
  });

  it("レポートなしセッションはNULLS LASTで末尾に来る", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const withReport = await createTestSession(config.id, testUser.id);
    await createTestReport(withReport.id, { total_content_richness: 50 });

    const withoutReport = await createTestSession(config.id, testUser.id);
    // レポートなし

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(withReport.id);
    expect(data![1].session_id).toBe(withoutReport.id);
  });
});
