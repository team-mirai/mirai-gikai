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

/**
 * 同一configに複数セッションを作成するヘルパー
 */
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

describe("find_sessions_ordered_by_message_count() 関数", () => {
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

  it("メッセージ数の降順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(session1.id, 2);

    const session2 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(session2.id, 5);

    const session3 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(session3.id, 1);

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
    expect(data).toHaveLength(3);
    expect(data![0].session_id).toBe(session2.id);
    expect(data![1].session_id).toBe(session1.id);
    expect(data![2].session_id).toBe(session3.id);
  });

  it("メッセージ数の昇順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(session1.id, 3);

    const session2 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(session2.id, 1);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: true,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(session2.id);
    expect(data![1].session_id).toBe(session1.id);
  });

  it("offset/limitでページネーションが正しく動作する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const sessions = [];
    for (let i = 0; i < 5; i++) {
      const session = await createTestSession(config.id, testUser.id);
      await createTestInterviewMessages(session.id, (i + 1) * 2);
      sessions.push(session);
    }

    // 降順: 10, 8, 6, 4, 2 → offset=1, limit=2 → 8, 6
    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 1,
        p_limit: 2,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(sessions[3].id); // 8メッセージ
    expect(data![1].session_id).toBe(sessions[2].id); // 6メッセージ
  });

  it("別のconfigのセッションは含まれない", async () => {
    const bill1 = await createTestBill();
    billIds.push(bill1.id);
    const config1 = await createTestInterviewConfig(bill1.id);
    const session1 = await createTestSession(config1.id, testUser.id);
    await createTestInterviewMessages(session1.id, 10);

    const bill2 = await createTestBill();
    billIds.push(bill2.id);
    const config2 = await createTestInterviewConfig(bill2.id);
    const session2 = await createTestSession(config2.id, testUser.id);
    await createTestInterviewMessages(session2.id, 5);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
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

  it("メッセージが0件のセッションも結果に含まれる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const sessionWithMessages = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(sessionWithMessages.id, 3);

    const sessionEmpty = await createTestSession(config.id, testUser.id);
    // メッセージを追加しない

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
    // 降順: 3件のセッションが先、0件が後
    expect(data![0].session_id).toBe(sessionWithMessages.id);
    expect(data![1].session_id).toBe(sessionEmpty.id);
  });

  it("存在しないconfig_idでは空配列を返す", async () => {
    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_message_count",
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
