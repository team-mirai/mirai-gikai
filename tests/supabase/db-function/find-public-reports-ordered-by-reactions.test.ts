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
  overrides: Partial<{
    total_score: number | null;
    is_public_by_admin: boolean;
    is_public_by_user: boolean;
  }> = {}
) {
  const totalScore = overrides.total_score ?? null;
  const scores = totalScore != null ? { total: totalScore, clarity: 80 } : null;
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      scores,
      is_public_by_admin: overrides.is_public_by_admin ?? true,
      is_public_by_user: overrides.is_public_by_user ?? true,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

async function createTestReaction(
  reportId: string,
  userId: string,
  reactionType: "helpful" | "hmm"
) {
  const { error } = await adminClient.from("report_reactions").insert({
    interview_report_id: reportId,
    user_id: userId,
    reaction_type: reactionType,
  });
  if (error) throw new Error(`report_reaction 作成失敗: ${error.message}`);
}

describe("find_public_reports_by_bill_id_ordered_by_reactions() 関数", () => {
  let testUsers: TestUser[];
  const billIds: string[] = [];

  beforeEach(async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();
    testUsers = [user1, user2, user3];
  });

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
    for (const user of testUsers) {
      await cleanupTestUser(user.id);
    }
  });

  it("helpfulリアクション数の降順でレポートを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // レポート3件作成（全て公開）
    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id, { total_score: 90 });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, { total_score: 80 });

    const session3 = await createTestSession(config.id, testUsers[2].id);
    const report3 = await createTestReport(session3.id, { total_score: 70 });

    // report2: helpful x2, report3: helpful x1, report1: helpful x0
    await createTestReaction(report2.id, testUsers[0].id, "helpful");
    await createTestReaction(report2.id, testUsers[2].id, "helpful");
    await createTestReaction(report3.id, testUsers[0].id, "helpful");

    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data![0].id).toBe(report2.id); // helpful x2
    expect(data![1].id).toBe(report3.id); // helpful x1
    expect(data![2].id).toBe(report1.id); // helpful x0
  });

  it("hmmリアクションはソート順に影響しない", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id, { total_score: 80 });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, { total_score: 90 });

    // report1: hmm x2 (helpfulは0), report2: helpful x1
    await createTestReaction(report1.id, testUsers[1].id, "hmm");
    await createTestReaction(report1.id, testUsers[2].id, "hmm");
    await createTestReaction(report2.id, testUsers[0].id, "helpful");

    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].id).toBe(report2.id); // helpful x1
    expect(data![1].id).toBe(report1.id); // helpful x0 (hmm無視)
  });

  it("helpfulが同数の場合はtotal_score降順でソートされる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id, { total_score: 70 });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, { total_score: 90 });

    // 両方ともhelpful x0
    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].id).toBe(report2.id); // total_score: 90
    expect(data![1].id).toBe(report1.id); // total_score: 70
  });

  it("非公開レポートは返さない", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUsers[0].id);
    await createTestReport(session1.id, { is_public_by_admin: false });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    await createTestReport(session2.id, { is_public_by_user: false });

    const session3 = await createTestSession(config.id, testUsers[2].id);
    const publicReport = await createTestReport(session3.id);

    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(publicReport.id);
  });

  it("p_limitで返却件数を制限できる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // 3件のレポートを作成
    for (const user of testUsers) {
      const session = await createTestSession(config.id, user.id);
      await createTestReport(session.id);
    }

    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id, p_limit: 2 }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });
});
