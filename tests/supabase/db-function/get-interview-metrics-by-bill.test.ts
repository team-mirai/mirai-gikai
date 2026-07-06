import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
} from "../utils";

/**
 * get_interview_metrics_by_bill の統合テスト。
 *
 * 検証観点:
 * - 複数設定を跨いだ実施数・完了数の合算
 * - completed_at の有無による完了数のカウント
 * - 完了率（completed/conducted）の算出と丸め
 * - 論理削除済み設定の除外
 * - セッション0件の議案（実施0・完了率0）の扱い
 * - p_bill_id によるフィルタ
 */
describe("get_interview_metrics_by_bill", () => {
  // billA: config1(3件中2件完了) + config2(1件完了) => 実施4・完了3・率0.75
  let billA: { id: string };
  // billB: 設定はあるがセッション0件 => 実施0・完了0・率0
  let billB: { id: string };
  // billC: 論理削除済み設定のみ（セッションあり） => 結果に含まれない
  let billC: { id: string };
  let user: { id: string };

  async function insertSession(configId: string, completed: boolean) {
    const now = new Date().toISOString();
    const { error } = await adminClient.from("interview_sessions").insert({
      interview_config_id: configId,
      user_id: user.id,
      started_at: now,
      completed_at: completed ? now : null,
    });
    if (error) throw new Error(`session 作成失敗: ${error.message}`);
  }

  async function insertConfig(
    billId: string,
    name: string,
    status: "public" | "closed",
    deleted: boolean
  ): Promise<string> {
    const { data, error } = await adminClient
      .from("interview_configs")
      .insert({
        bill_id: billId,
        status,
        name,
        deleted_at: deleted ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error || !data) throw new Error(`config 作成失敗: ${error?.message}`);
    return data.id;
  }

  beforeAll(async () => {
    user = await createTestUser();
    billA = await createTestBill();
    billB = await createTestBill();
    billC = await createTestBill();

    // billA: 2設定を合算
    const configA1 = await insertConfig(billA.id, "設定A1", "public", false);
    await insertSession(configA1, true);
    await insertSession(configA1, true);
    await insertSession(configA1, false);
    const configA2 = await insertConfig(billA.id, "設定A2", "closed", false);
    await insertSession(configA2, true);

    // billB: 設定はあるがセッション無し
    await insertConfig(billB.id, "設定B", "public", false);

    // billC: 論理削除済み設定（セッション有りだが除外されるべき）
    const configC = await insertConfig(billC.id, "設定C", "closed", true);
    await insertSession(configC, true);
    await insertSession(configC, true);
  });

  afterAll(async () => {
    await cleanupTestBill(billA.id);
    await cleanupTestBill(billB.id);
    await cleanupTestBill(billC.id);
    await cleanupTestUser(user.id);
  });

  it("複数設定を合算し実施数・完了数・完了率を算出する", async () => {
    const { data, error } = await adminClient.rpc(
      "get_interview_metrics_by_bill",
      { p_bill_id: billA.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    const row = data![0];
    expect(row.bill_id).toBe(billA.id);
    expect(Number(row.conducted_count)).toBe(4);
    expect(Number(row.completed_count)).toBe(3);
    expect(Number(row.completion_rate)).toBeCloseTo(0.75, 3);
  });

  it("セッション0件の議案は実施0・完了率0で返す", async () => {
    const { data, error } = await adminClient.rpc(
      "get_interview_metrics_by_bill",
      { p_bill_id: billB.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    const row = data![0];
    expect(Number(row.conducted_count)).toBe(0);
    expect(Number(row.completed_count)).toBe(0);
    expect(Number(row.completion_rate)).toBe(0);
  });

  it("論理削除済み設定のみの議案は結果に含まれない", async () => {
    const { data, error } = await adminClient.rpc(
      "get_interview_metrics_by_bill",
      { p_bill_id: billC.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("p_bill_id未指定なら設定を持つ全議案を返す", async () => {
    const { data, error } = await adminClient.rpc(
      "get_interview_metrics_by_bill",
      {}
    );

    expect(error).toBeNull();
    const byId = new Map(data!.map((r) => [r.bill_id, r]));
    expect(byId.has(billA.id)).toBe(true);
    expect(byId.has(billB.id)).toBe(true);
    // 論理削除済み設定のみの議案は含まれない
    expect(byId.has(billC.id)).toBe(false);
    expect(Number(byId.get(billA.id)!.conducted_count)).toBe(4);
  });
});
