import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  adminClient,
  createTestBill,
  createTestUser,
  cleanupTestBill,
  cleanupTestUser,
} from "../utils";

describe("count_sessions_by_config_ids", () => {
  let bill1: { id: string };
  let bill2: { id: string };
  let user: { id: string };
  let configId1: string;
  let configId2: string;
  let configIdEmpty: string;

  beforeAll(async () => {
    user = await createTestUser();
    bill1 = await createTestBill();
    bill2 = await createTestBill();

    // config1: セッション3件
    const { data: c1 } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: bill1.id, status: "public", name: "設定1" })
      .select()
      .single();
    configId1 = c1!.id;

    for (let i = 0; i < 3; i++) {
      await adminClient.from("interview_sessions").insert({
        interview_config_id: configId1,
        user_id: user.id,
        started_at: new Date().toISOString(),
      });
    }

    // config2: セッション1件
    const { data: c2, error: c2Error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: bill1.id, status: "closed", name: "設定2" })
      .select()
      .single();
    if (c2Error) throw new Error(`config2 作成失敗: ${c2Error.message}`);
    configId2 = c2!.id;

    await adminClient.from("interview_sessions").insert({
      interview_config_id: configId2,
      user_id: user.id,
      started_at: new Date().toISOString(),
    });

    // configEmpty: セッション0件
    const { data: c3 } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: bill2.id, status: "closed", name: "設定3（空）" })
      .select()
      .single();
    configIdEmpty = c3!.id;
  });

  afterAll(async () => {
    await cleanupTestBill(bill1.id);
    await cleanupTestBill(bill2.id);
    await cleanupTestUser(user.id);
  });

  it("複数configのセッション数を正しくカウントする", async () => {
    const { data, error } = await adminClient.rpc(
      "count_sessions_by_config_ids",
      { p_config_ids: [configId1, configId2] }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);

    const map = new Map(
      data!.map((r) => [r.interview_config_id, r.session_count])
    );
    expect(map.get(configId1)).toBe(3);
    expect(map.get(configId2)).toBe(1);
  });

  it("セッションが0件のconfigは結果に含まれない", async () => {
    const { data, error } = await adminClient.rpc(
      "count_sessions_by_config_ids",
      { p_config_ids: [configIdEmpty] }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("空配列を渡すと空の結果を返す", async () => {
    const { data, error } = await adminClient.rpc(
      "count_sessions_by_config_ids",
      { p_config_ids: [] }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("存在しないconfig IDを渡すと空の結果を返す", async () => {
    const { data, error } = await adminClient.rpc(
      "count_sessions_by_config_ids",
      { p_config_ids: ["00000000-0000-0000-0000-000000000000"] }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
