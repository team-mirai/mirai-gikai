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

async function createTestSession(
  configId: string,
  userId: string,
  overrides: Partial<{
    completed_at: string;
    rating: number;
  }> = {}
) {
  const { data, error } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
      ...overrides,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_session 作成失敗: ${error.message}`);
  return data;
}

async function createTestReport(
  sessionId: string,
  overrides: Partial<{
    stance: "for" | "against" | "neutral";
    role:
      | "subject_expert"
      | "work_related"
      | "daily_life_affected"
      | "general_citizen";
    content_richness: { total: number };
    is_public_by_user: boolean;
  }> = {}
) {
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      ...overrides,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

describe("get_interview_statistics() 関数", () => {
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

  it("セッション数・完了数を正しく集計する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // 完了セッション2件 + 未完了セッション1件
    const now = new Date();
    const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    await createTestSession(config.id, testUser.id, {
      completed_at: fiveMinLater,
    });
    await createTestSession(config.id, testUser.id, {
      completed_at: fiveMinLater,
    });
    await createTestSession(config.id, testUser.id);

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config.id,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].total_sessions).toBe(3);
    expect(data?.[0].completed_sessions).toBe(2);
  });

  it("満足度の平均を正しく計算する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    await createTestSession(config.id, testUser.id, { rating: 5 });
    await createTestSession(config.id, testUser.id, { rating: 3 });
    await createTestSession(config.id, testUser.id); // rating なし

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config.id,
    });

    expect(error).toBeNull();
    // AVG(5, 3, NULL) = 4.00
    expect(Number(data?.[0].avg_rating)).toBeCloseTo(4.0, 1);
  });

  it("スタンス分布を正しく集計する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, { stance: "for" });
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, { stance: "for" });
    const s3 = await createTestSession(config.id, testUser.id);
    await createTestReport(s3.id, { stance: "against" });
    const s4 = await createTestSession(config.id, testUser.id);
    await createTestReport(s4.id, { stance: "neutral" });

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config.id,
    });

    expect(error).toBeNull();
    expect(data?.[0].stance_for_count).toBe(2);
    expect(data?.[0].stance_against_count).toBe(1);
    expect(data?.[0].stance_neutral_count).toBe(1);
  });

  it("平均スコアを正しく計算する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, { content_richness: { total: 80 } });
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, { content_richness: { total: 60 } });

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config.id,
    });

    expect(error).toBeNull();
    expect(Number(data?.[0].avg_total_content_richness)).toBeCloseTo(70.0, 0);
  });

  it("役割分布を正しく集計する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, { role: "subject_expert" });
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, { role: "general_citizen" });
    const s3 = await createTestSession(config.id, testUser.id);
    await createTestReport(s3.id, { role: "general_citizen" });

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config.id,
    });

    expect(error).toBeNull();
    expect(data?.[0].role_subject_expert_count).toBe(1);
    expect(data?.[0].role_work_related_count).toBe(0);
    expect(data?.[0].role_daily_life_affected_count).toBe(0);
    expect(data?.[0].role_general_citizen_count).toBe(2);
  });

  it("平均メッセージ数を正しく計算する（0件セッション含む）", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(s1.id, 6);
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestInterviewMessages(s2.id, 4);
    await createTestSession(config.id, testUser.id); // 0件

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config.id,
    });

    expect(error).toBeNull();
    // AVG(6, 4, 0) = 3.3 （COALESCE で0件も含む）
    expect(Number(data?.[0].avg_message_count)).toBeCloseTo(3.3, 0);
  });

  it("公開許可数を正しく集計する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, { is_public_by_user: true });
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, { is_public_by_user: false });
    const s3 = await createTestSession(config.id, testUser.id);
    await createTestReport(s3.id, { is_public_by_user: true });

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config.id,
    });

    expect(error).toBeNull();
    expect(data?.[0].public_by_user_count).toBe(2);
  });

  it("別のconfigのデータは含まれない", async () => {
    const bill1 = await createTestBill();
    billIds.push(bill1.id);
    const config1 = await createTestInterviewConfig(bill1.id);
    await createTestSession(config1.id, testUser.id);

    const bill2 = await createTestBill();
    billIds.push(bill2.id);
    const config2 = await createTestInterviewConfig(bill2.id);
    await createTestSession(config2.id, testUser.id);
    await createTestSession(config2.id, testUser.id);

    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: config1.id,
    });

    expect(error).toBeNull();
    expect(data?.[0].total_sessions).toBe(1);
  });

  it("存在しないconfig_idではすべてゼロ/NULLの行を返す", async () => {
    const { data, error } = await adminClient.rpc("get_interview_statistics", {
      p_config_id: "00000000-0000-0000-0000-000000000000",
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].total_sessions).toBe(0);
    expect(data?.[0].completed_sessions).toBe(0);
    expect(data?.[0].avg_rating).toBeNull();
    expect(data?.[0].stance_for_count).toBe(0);
  });
});
