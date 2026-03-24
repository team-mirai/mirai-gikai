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

async function createTestReport(sessionId: string) {
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

async function createTestReactions(
  reportId: string,
  userIds: string[],
  reactionType: "helpful" | "hmm" = "helpful"
) {
  const reactions = userIds.map((userId) => ({
    interview_report_id: reportId,
    user_id: userId,
    reaction_type: reactionType,
  }));
  const { error } = await adminClient
    .from("report_reactions")
    .insert(reactions);
  if (error) throw new Error(`report_reactions 作成失敗: ${error.message}`);
}

describe("find_sessions_ordered_by_helpful_count() 関数", () => {
  let testUsers: TestUser[] = [];
  const billIds: string[] = [];

  beforeEach(async () => {
    // リアクション用に複数ユーザーを作成
    for (let i = 0; i < 5; i++) {
      testUsers.push(await createTestUser());
    }
  });

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
    for (const user of testUsers) {
      await cleanupTestUser(user.id);
    }
    testUsers = [];
  });

  it("参考になるリアクション数の降順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // session1: 1 helpful
    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id);
    await createTestReactions(report1.id, [testUsers[0].id]);

    // session2: 3 helpful
    const session2 = await createTestSession(config.id, testUsers[0].id);
    const report2 = await createTestReport(session2.id);
    await createTestReactions(report2.id, [
      testUsers[0].id,
      testUsers[1].id,
      testUsers[2].id,
    ]);

    // session3: 2 helpful
    const session3 = await createTestSession(config.id, testUsers[0].id);
    const report3 = await createTestReport(session3.id);
    await createTestReactions(report3.id, [testUsers[0].id, testUsers[1].id]);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_helpful_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data![0].session_id).toBe(session2.id); // 3
    expect(data![1].session_id).toBe(session3.id); // 2
    expect(data![2].session_id).toBe(session1.id); // 1
  });

  it("参考になるリアクション数の昇順でセッションIDを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id);
    await createTestReactions(report1.id, [testUsers[0].id, testUsers[1].id]);

    const session2 = await createTestSession(config.id, testUsers[0].id);
    const report2 = await createTestReport(session2.id);
    await createTestReactions(report2.id, [testUsers[0].id]);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_helpful_count",
      {
        p_config_id: config.id,
        p_ascending: true,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(session2.id); // 1
    expect(data![1].session_id).toBe(session1.id); // 2
  });

  it("リアクションなしのセッションは0として扱われる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // session1: 2 helpful
    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id);
    await createTestReactions(report1.id, [testUsers[0].id, testUsers[1].id]);

    // session2: no report (no reactions)
    const session2 = await createTestSession(config.id, testUsers[0].id);

    // session3: report but no reactions
    const session3 = await createTestSession(config.id, testUsers[0].id);
    await createTestReport(session3.id);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_helpful_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data![0].session_id).toBe(session1.id); // 2
    // session2 and session3 both have 0, sorted by started_at DESC
  });

  it("hmmリアクションはhelpfulカウントに含まれない", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // session1: 1 helpful + 3 hmm
    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id);
    await createTestReactions(report1.id, [testUsers[0].id], "helpful");
    await createTestReactions(
      report1.id,
      [testUsers[1].id, testUsers[2].id, testUsers[3].id],
      "hmm"
    );

    // session2: 2 helpful
    const session2 = await createTestSession(config.id, testUsers[0].id);
    const report2 = await createTestReport(session2.id);
    await createTestReactions(
      report2.id,
      [testUsers[0].id, testUsers[1].id],
      "helpful"
    );

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_helpful_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 0,
        p_limit: 10,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(session2.id); // 2 helpful
    expect(data![1].session_id).toBe(session1.id); // 1 helpful
  });

  it("offset/limitでページネーションが正しく動作する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const sessions = [];
    for (let i = 0; i < 4; i++) {
      const session = await createTestSession(config.id, testUsers[0].id);
      const report = await createTestReport(session.id);
      // i+1 個のhelpfulリアクション
      await createTestReactions(
        report.id,
        testUsers.slice(0, i + 1).map((u) => u.id)
      );
      sessions.push(session);
    }

    // 降順: 4, 3, 2, 1 → offset=1, limit=2 → 3, 2
    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_helpful_count",
      {
        p_config_id: config.id,
        p_ascending: false,
        p_offset: 1,
        p_limit: 2,
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].session_id).toBe(sessions[2].id); // 3 helpful
    expect(data![1].session_id).toBe(sessions[1].id); // 2 helpful
  });

  it("別のconfigのセッションは含まれない", async () => {
    const bill1 = await createTestBill();
    billIds.push(bill1.id);
    const config1 = await createTestInterviewConfig(bill1.id);
    const session1 = await createTestSession(config1.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id);
    await createTestReactions(report1.id, [testUsers[0].id]);

    const bill2 = await createTestBill();
    billIds.push(bill2.id);
    const config2 = await createTestInterviewConfig(bill2.id);
    const session2 = await createTestSession(config2.id, testUsers[0].id);
    const report2 = await createTestReport(session2.id);
    await createTestReactions(report2.id, [
      testUsers[0].id,
      testUsers[1].id,
      testUsers[2].id,
    ]);

    const { data, error } = await adminClient.rpc(
      "find_sessions_ordered_by_helpful_count",
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
      "find_sessions_ordered_by_helpful_count",
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
