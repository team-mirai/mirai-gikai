import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "../../../packages/supabase/types/supabase.types";
import { adminClient, cleanupTestBill, createTestBill } from "../utils";

type ConfigUpdate = Database["public"]["Tables"]["interview_configs"]["Update"];

async function createConfig(billId: string, status: "public" | "closed") {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({ bill_id: billId, name: "テスト設定", status })
    .select("id, published_at")
    .single();
  if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);
  return data;
}

async function updateConfig(configId: string, patch: ConfigUpdate) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .update(patch)
    .eq("id", configId)
    .select("published_at")
    .single();
  if (error) throw new Error(`interview_config 更新失敗: ${error.message}`);
  return data.published_at;
}

describe("set_interview_configs_published_at トリガー", () => {
  const billIds: string[] = [];

  async function createBillId() {
    const bill = await createTestBill();
    billIds.push(bill.id);
    return bill.id;
  }

  afterEach(async () => {
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  it("公開すると published_at が入り、closed にすると消える", async () => {
    const config = await createConfig(await createBillId(), "closed");
    expect(config.published_at).toBeNull();

    expect(await updateConfig(config.id, { status: "public" })).not.toBeNull();
    expect(await updateConfig(config.id, { status: "closed" })).toBeNull();
  });

  it("公開状態で作成すると published_at が入り、他の列の更新や直接の書き換えでは変わらない", async () => {
    const config = await createConfig(await createBillId(), "public");
    expect(config.published_at).not.toBeNull();

    expect(
      await updateConfig(config.id, { name: "名前を変更", published_at: null })
    ).toBe(config.published_at);
  });
});
