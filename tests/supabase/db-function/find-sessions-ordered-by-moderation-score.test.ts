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

async function createTestReportWithModerationScore(
  sessionId: string,
  moderationScore: number | null
) {
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      moderation_score: moderationScore,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

describe("find_sessions_ordered_by_moderation_score() 関数", () => {
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

  it("モデレーションスコアの降順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // session1: score 10
    const session1 = await createTestSession(config.id, testUser.id);
    await createTestReportWithModerationScore(session1.id, 10);

    // session2: score 80
    const session2 = await createTestSession(config.id, testUser.id);
    await createTestReportWithModerationScore(session2.id, 80);

    // session3: score 45
    const session3 = await createTestSession(config.id, testUser.id);
    await createTestReportWithModerationScore(session3.id, 45);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_moderation_score",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data![0].session_id).toBe(session2.id); // 80
    expect(data![1].session_id).toBe(session3.id); // 45
    expect(data![2].session_id).toBe(session1.id); // 10
  });

  it("モデレーションスコアの昇順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUser.id);
    await createTestReportWithModerationScore(session1.id, 60);

    const session2 = await createTestSession(config.id, testUser.id);
    await createTestReportWithModerationScore(session2.id, 20);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_moderation_score",
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
    expect(data![1].session_id).toBe(session1.id); // 60
  });

  it("NULLスコアのセッションは末尾に配置される", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // session1: score 50
    const session1 = await createTestSession(config.id, testUser.id);
    await createTestReportWithModerationScore(session1.id, 50);

    // session2: no report (null score)
    const session2 = await createTestSession(config.id, testUser.id);

    // session3: report with null score
    const session3 = await createTestSession(config.id, testUser.id);
    await createTestReportWithModerationScore(session3.id, null);

    // 降順: 50が先、NULL2つが後
    const { data: descData, error: descError } = await adminClient.rpc(
      "find_sessions_ordered_by_moderation_score",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(descError).toBeNull();
    expect(descData).toHaveLength(3);
    expect(descData![0].session_id).toBe(session1.id); // 50

    // 昇順でもNULLは末尾
    const { data: ascData, error: ascError } = await adminClient.rpc(
      "find_sessions_ordered_by_moderation_score",
      {
        p_config_id: config.id,
        p_ascending: true,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(ascError).toBeNull();
    expect(ascData).toHaveLength(3);
    expect(ascData![0].session_id).toBe(session1.id); // 50
  });

  it("offset/limitでページネーションが正しく動作する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const sessions = [];
    for (let i = 0; i < 4; i++) {
      const session = await createTestSession(config.id, testUser.id);
      await createTestReportWithModerationScore(session.id, (i + 1) * 20);
      sessions.push(session);
    }

    // 降順: 80, 60, 40, 20 → offset=1, limit=2 → 60, 40
    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_moderation_score",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 1,
        p_limit: 2,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(sessions[2].id); // 60
    expect(data![1].session_id).toBe(sessions[1].id); // 40
  });

  it("別のconfigのセッションは含まれない", async () => {
    const bill1 = await createTestBill();
    billIds.push(bill1.id);
    const config1 = await createTestInterviewConfig(bill1.id);
    const session1 = await createTestSession(config1.id, testUser.id);
    await createTestReportWithModerationScore(session1.id, 30);

    const bill2 = await createTestBill();
    billIds.push(bill2.id);
    const config2 = await createTestInterviewConfig(bill2.id);
    const session2 = await createTestSession(config2.id, testUser.id);
    await createTestReportWithModerationScore(session2.id, 90);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_moderation_score",
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
      "find_sessions_ordered_by_moderation_score",
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
