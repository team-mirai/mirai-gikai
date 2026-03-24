import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
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

async function createTestSession(configId: string, userId: string) {
  const { data, error } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`interview_session 作成失敗: ${error.message}`);
  return data;
}

async function createTestReport(
  sessionId: string,
  totalContentRichness: number | null
) {
  const content_richness =
    totalContentRichness != null
      ? { total: totalContentRichness, clarity: 80 }
      : null;
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      content_richness,
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

    const session1 = await createTestSession(config.id, testUser.id);
    await createTestReport(session1.id, 60);

    const session2 = await createTestSession(config.id, testUser.id);
    await createTestReport(session2.id, 90);

    const session3 = await createTestSession(config.id, testUser.id);
    await createTestReport(session3.id, 30);

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
    expect(data![0].session_id).toBe(session2.id); // 90
    expect(data![1].session_id).toBe(session1.id); // 60
    expect(data![2].session_id).toBe(session3.id); // 30
  });

  it("充実度の昇順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUser.id);
    await createTestReport(session1.id, 80);

    const session2 = await createTestSession(config.id, testUser.id);
    await createTestReport(session2.id, 20);

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
    expect(data![0].session_id).toBe(session2.id); // 20
    expect(data![1].session_id).toBe(session1.id); // 80
  });

  it("充実度がnullのセッションはNULLS LASTで末尾に配置される", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const sessionWithRichness = await createTestSession(config.id, testUser.id);
    await createTestReport(sessionWithRichness.id, 50);

    const sessionNoReport = await createTestSession(config.id, testUser.id);
    // レポートなし → total_content_richness = null

    const sessionNullRichness = await createTestSession(config.id, testUser.id);
    await createTestReport(sessionNullRichness.id, null);

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
    expect(data![0].session_id).toBe(sessionWithRichness.id); // 50
    // null系は末尾
  });

  it("offset/limitでページネーションが正しく動作する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const sessions = [];
    for (let i = 0; i < 5; i++) {
      const session = await createTestSession(config.id, testUser.id);
      await createTestReport(session.id, (i + 1) * 10);
      sessions.push(session);
    }

    // 降順: 50, 40, 30, 20, 10 → offset=1, limit=2 → 40, 30
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
    expect(data![0].session_id).toBe(sessions[3].id); // 40
    expect(data![1].session_id).toBe(sessions[2].id); // 30
  });

  it("別のconfigのセッションは含まれない", async () => {
    const bill1 = await createTestBill();
    billIds.push(bill1.id);
    const config1 = await createTestInterviewConfig(bill1.id);
    const session1 = await createTestSession(config1.id, testUser.id);
    await createTestReport(session1.id, 90);

    const bill2 = await createTestBill();
    billIds.push(bill2.id);
    const config2 = await createTestInterviewConfig(bill2.id);
    const session2 = await createTestSession(config2.id, testUser.id);
    await createTestReport(session2.id, 50);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
      {
        p_config_id: config1.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].session_id).toBe(session1.id);
  });

  it("存在しないconfig_idでは空配列を返す", async () => {
    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_total_content_richness",
      {
        p_config_id: "00000000-0000-0000-0000-000000000000",
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
