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
    is_public_by_user: boolean;
    is_public_by_admin: boolean;
    moderation_score: number;
    content_richness: { total: number };
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

describe("count_bulk_publish_targets / bulk_publish_reports", () => {
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

  it("条件に合致するレポートのみカウントされる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // 対象: is_public_by_user=true, is_public_by_admin=false, moderation_score<=29, total_content_richness>=50
    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 20,
      content_richness: { total: 60 },
    });

    // 対象外: is_public_by_user=false
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: false,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 70 },
    });

    // 対象外: moderation_score > 29
    const s3 = await createTestSession(config.id, testUser.id);
    await createTestReport(s3.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 50,
      content_richness: { total: 80 },
    });

    // 対象外: total_content_richness < 50
    const s4 = await createTestSession(config.id, testUser.id);
    await createTestReport(s4.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 30 },
    });

    // 対象外: is_public_by_admin=true（既に公開済み）
    const s5 = await createTestSession(config.id, testUser.id);
    await createTestReport(s5.id, {
      is_public_by_user: true,
      is_public_by_admin: true,
      moderation_score: 10,
      content_richness: { total: 60 },
    });

    const { data, error } = await adminClient.rpc(
      "count_bulk_publish_targets",
      {
        p_config_id: config.id,
        p_max_moderation_score: 29,
        p_min_content_richness: 50,
      }
    );

    expect(error).toBeNull();
    expect(data).toBe(1);
  });

  it("moderation_scoreやtotal_content_richnessがNULLのレポートは除外される", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // moderation_score が NULL
    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      content_richness: { total: 60 },
    });

    // content_richness が NULL（total_content_richness も NULL）
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
    });

    const { data, error } = await adminClient.rpc(
      "count_bulk_publish_targets",
      {
        p_config_id: config.id,
        p_max_moderation_score: 29,
        p_min_content_richness: 50,
      }
    );

    expect(error).toBeNull();
    expect(data).toBe(0);
  });

  it("別configのレポートはカウントされない", async () => {
    const bill1 = await createTestBill();
    const bill2 = await createTestBill();
    billIds.push(bill1.id, bill2.id);
    const config1 = await createTestInterviewConfig(bill1.id);
    const config2 = await createTestInterviewConfig(bill2.id);

    // config1 のレポート（対象）
    const s1 = await createTestSession(config1.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 60 },
    });

    // config2 のレポート（別configなので対象外）
    const s2 = await createTestSession(config2.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 60 },
    });

    const { data, error } = await adminClient.rpc(
      "count_bulk_publish_targets",
      {
        p_config_id: config1.id,
        p_max_moderation_score: 29,
        p_min_content_richness: 50,
      }
    );

    expect(error).toBeNull();
    expect(data).toBe(1);
  });

  it("bulk_publish_reportsが対象レポートのみ更新し件数を返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // 対象レポート2件
    const s1 = await createTestSession(config.id, testUser.id);
    const r1 = await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 20,
      content_richness: { total: 60 },
    });

    const s2 = await createTestSession(config.id, testUser.id);
    const r2 = await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 80 },
    });

    // 対象外レポート
    const s3 = await createTestSession(config.id, testUser.id);
    const r3 = await createTestReport(s3.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 50,
      content_richness: { total: 80 },
    });

    const { data, error } = await adminClient.rpc("bulk_publish_reports", {
      p_config_id: config.id,
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    });

    expect(error).toBeNull();
    expect(data).toBe(2);

    // 対象レポートが公開されていることを確認
    const { data: updated1 } = await adminClient
      .from("interview_report")
      .select("is_public_by_admin")
      .eq("id", r1.id)
      .single();
    expect(updated1?.is_public_by_admin).toBe(true);

    const { data: updated2 } = await adminClient
      .from("interview_report")
      .select("is_public_by_admin")
      .eq("id", r2.id)
      .single();
    expect(updated2?.is_public_by_admin).toBe(true);

    // 対象外レポートは変更されていないことを確認
    const { data: notUpdated } = await adminClient
      .from("interview_report")
      .select("is_public_by_admin")
      .eq("id", r3.id)
      .single();
    expect(notUpdated?.is_public_by_admin).toBe(false);
  });

  it("countとbulkPublishの件数が一致する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 15,
      content_richness: { total: 70 },
    });

    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 25,
      content_richness: { total: 55 },
    });

    const params = {
      p_config_id: config.id,
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    };

    const { data: count } = await adminClient.rpc(
      "count_bulk_publish_targets",
      params
    );
    const { data: updated } = await adminClient.rpc(
      "bulk_publish_reports",
      params
    );

    expect(count).toBe(updated);
    expect(count).toBe(2);
  });
});
