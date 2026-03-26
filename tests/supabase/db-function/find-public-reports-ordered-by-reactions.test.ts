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
    total_content_richness: number | null;
    is_public_by_admin: boolean;
    is_public_by_user: boolean;
    stance: "for" | "against" | "neutral";
  }> = {}
) {
  const totalRichness = overrides.total_content_richness ?? null;
  const content_richness =
    totalRichness != null ? { total: totalRichness, clarity: 80 } : null;
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      content_richness,
      is_public_by_admin: overrides.is_public_by_admin ?? true,
      is_public_by_user: overrides.is_public_by_user ?? true,
      stance: overrides.stance ?? null,
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

  it("helpful×5+total_content_richnessの重み付きスコア降順でレポートを返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // report1: helpful x0, total_content_richness=90 → weighted=90
    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id, {
      total_content_richness: 90,
    });

    // report2: helpful x2, total_content_richness=80 → weighted=10+80=90
    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, {
      total_content_richness: 80,
    });

    // report3: helpful x3, total_content_richness=70 → weighted=15+70=85
    const session3 = await createTestSession(config.id, testUsers[2].id);
    const report3 = await createTestReport(session3.id, {
      total_content_richness: 70,
    });

    await createTestReaction(report2.id, testUsers[0].id, "helpful");
    await createTestReaction(report2.id, testUsers[2].id, "helpful");
    await createTestReaction(report3.id, testUsers[0].id, "helpful");
    await createTestReaction(report3.id, testUsers[1].id, "helpful");
    await createTestReaction(report3.id, testUsers[2].id, "helpful");

    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    // weighted: report1=90, report2=90, report3=85
    // report1とreport2は同スコア → created_at降順（後に作られたreport2が先）
    expect(data![0].id).toBe(report2.id); // weighted=90 (created later)
    expect(data![1].id).toBe(report1.id); // weighted=90 (created earlier)
    expect(data![2].id).toBe(report3.id); // weighted=85
  });

  it("hmmリアクションは重み付きスコアに影響しない", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // report1: hmm x2, helpful x0, total_content_richness=80 → weighted=80
    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id, {
      total_content_richness: 80,
    });

    // report2: helpful x1, total_content_richness=70 → weighted=5+70=75
    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, {
      total_content_richness: 70,
    });

    await createTestReaction(report1.id, testUsers[1].id, "hmm");
    await createTestReaction(report1.id, testUsers[2].id, "hmm");
    await createTestReaction(report2.id, testUsers[0].id, "helpful");

    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].id).toBe(report1.id); // weighted=80 (hmmはスコアに寄与しない)
    expect(data![1].id).toBe(report2.id); // weighted=75
  });

  it("helpfulが同数の場合はtotal_content_richnessの差で順序が決まる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // report1: helpful x0, total_content_richness=70 → weighted=70
    const session1 = await createTestSession(config.id, testUsers[0].id);
    const report1 = await createTestReport(session1.id, {
      total_content_richness: 70,
    });

    // report2: helpful x0, total_content_richness=90 → weighted=90
    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, {
      total_content_richness: 90,
    });

    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].id).toBe(report2.id); // weighted=90
    expect(data![1].id).toBe(report1.id); // weighted=70
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

  it("p_offsetでスキップできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // 3件のレポートを作成（異なるtotal_content_richnessで順序を確定）
    const session1 = await createTestSession(config.id, testUsers[0].id);
    await createTestReport(session1.id, { total_content_richness: 90 });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, {
      total_content_richness: 80,
    });

    const session3 = await createTestSession(config.id, testUsers[2].id);
    const report3 = await createTestReport(session3.id, {
      total_content_richness: 70,
    });

    // offset=1で先頭をスキップ
    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id, p_offset: 1 }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].id).toBe(report2.id);
    expect(data![1].id).toBe(report3.id);
  });

  it("p_stanceでスタンスフィルターをかけられる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUsers[0].id);
    const reportFor = await createTestReport(session1.id, { stance: "for" });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    await createTestReport(session2.id, { stance: "against" });

    const session3 = await createTestSession(config.id, testUsers[2].id);
    const reportFor2 = await createTestReport(session3.id, { stance: "for" });

    // "for"のみフィルター
    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id, p_stance: "for" }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    const ids = data!.map((r: { id: string }) => r.id);
    expect(ids).toContain(reportFor.id);
    expect(ids).toContain(reportFor2.id);
  });

  it("p_offsetとp_stanceを組み合わせてページネーションできる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // "for"のレポートを3件作成
    const session1 = await createTestSession(config.id, testUsers[0].id);
    await createTestReport(session1.id, {
      stance: "for",
      total_content_richness: 90,
    });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    const report2 = await createTestReport(session2.id, {
      stance: "for",
      total_content_richness: 80,
    });

    const session3 = await createTestSession(config.id, testUsers[2].id);
    await createTestReport(session3.id, { stance: "against" });

    // "for"のみ、offset=1, limit=1
    const { data, error } = await adminClient.rpc(
      "find_public_reports_by_bill_id_ordered_by_reactions",
      { p_bill_id: bill.id, p_stance: "for", p_offset: 1, p_limit: 1 }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(report2.id);
  });
});

describe("count_public_reports_by_stance() 関数", () => {
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

  it("スタンスごとの公開レポート件数を返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUsers[0].id);
    await createTestReport(session1.id, { stance: "for" });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    await createTestReport(session2.id, { stance: "against" });

    const session3 = await createTestSession(config.id, testUsers[2].id);
    await createTestReport(session3.id, { stance: "for" });

    const { data, error } = await adminClient.rpc(
      "count_public_reports_by_stance",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);

    const forRow = data!.find(
      (r: { stance: string; count: number }) => r.stance === "for"
    );
    const againstRow = data!.find(
      (r: { stance: string; count: number }) => r.stance === "against"
    );
    expect(forRow?.count).toBe(2);
    expect(againstRow?.count).toBe(1);
  });

  it("非公開レポートはカウントしない", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session1 = await createTestSession(config.id, testUsers[0].id);
    await createTestReport(session1.id, {
      stance: "for",
      is_public_by_admin: false,
    });

    const session2 = await createTestSession(config.id, testUsers[1].id);
    await createTestReport(session2.id, { stance: "for" });

    const { data, error } = await adminClient.rpc(
      "count_public_reports_by_stance",
      { p_bill_id: bill.id }
    );

    expect(error).toBeNull();
    const forRow = data!.find(
      (r: { stance: string; count: number }) => r.stance === "for"
    );
    expect(forRow?.count).toBe(1);
  });
});
