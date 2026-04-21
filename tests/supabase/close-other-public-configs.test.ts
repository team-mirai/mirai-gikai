import { afterEach, describe, expect, it } from "vitest";
import { closeOtherPublicConfigs } from "../../admin/src/features/interview-config/server/repositories/interview-config-repository";
import { adminClient, cleanupTestBill, createTestBill } from "./utils";

describe("closeOtherPublicConfigs", () => {
  const createdBillIds: string[] = [];

  afterEach(async () => {
    for (const id of createdBillIds) {
      await cleanupTestBill(id);
    }
    createdBillIds.length = 0;
  });

  async function createConfig(
    billId: string,
    status: "public" | "closed",
    name: string
  ) {
    const { data, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status, name })
      .select()
      .single();
    if (error || !data) {
      throw new Error(`interview_config 作成失敗: ${error?.message}`);
    }
    return data;
  }

  it("excludeなしで呼ぶと、対象billのpublicなconfigはclosedになる", async () => {
    const bill = await createTestBill();
    createdBillIds.push(bill.id);
    const config = await createConfig(bill.id, "public", "公開中設定");

    await closeOtherPublicConfigs(bill.id);

    const { data: updated } = await adminClient
      .from("interview_configs")
      .select("status")
      .eq("id", config.id)
      .single();
    expect(updated?.status).toBe("closed");
  });

  it("既にclosedなconfigのupdated_atは変化しない", async () => {
    const bill = await createTestBill();
    createdBillIds.push(bill.id);
    const config = await createConfig(bill.id, "closed", "クローズ済み設定");
    const originalUpdatedAt = config.updated_at;

    // UPDATE BEFORE トリガでupdated_atが上書きされないことを確認するため、
    // 時刻が進んだ状態で呼び出す
    await new Promise((r) => setTimeout(r, 50));
    await closeOtherPublicConfigs(bill.id);

    const { data: after } = await adminClient
      .from("interview_configs")
      .select("updated_at")
      .eq("id", config.id)
      .single();
    expect(after?.updated_at).toBe(originalUpdatedAt);
  });

  it("別billのpublic configは影響を受けない", async () => {
    const billA = await createTestBill();
    const billB = await createTestBill();
    createdBillIds.push(billA.id, billB.id);
    const configA = await createConfig(billA.id, "public", "bill Aの設定");
    const configB = await createConfig(billB.id, "public", "bill Bの設定");

    await closeOtherPublicConfigs(billA.id);

    const { data: afterA } = await adminClient
      .from("interview_configs")
      .select("status")
      .eq("id", configA.id)
      .single();
    const { data: afterB } = await adminClient
      .from("interview_configs")
      .select("status")
      .eq("id", configB.id)
      .single();
    expect(afterA?.status).toBe("closed");
    expect(afterB?.status).toBe("public");
  });

  it("excludeConfigIdを渡すと、該当configは除外される", async () => {
    // 注: interview_configs には bill_id に対して public が 1 件という
    // 部分unique制約があるため、同一billで public を2件作れない。
    // そのため、別billで public を作り、exclude の挙動を確認する。
    const bill = await createTestBill();
    createdBillIds.push(bill.id);
    const kept = await createConfig(bill.id, "public", "残す設定");

    await closeOtherPublicConfigs(bill.id, kept.id);

    const { data: after } = await adminClient
      .from("interview_configs")
      .select("status")
      .eq("id", kept.id)
      .single();
    expect(after?.status).toBe("public");
  });

  it("対象のconfigが存在しなくてもエラーにならない", async () => {
    const bill = await createTestBill();
    createdBillIds.push(bill.id);

    await expect(closeOtherPublicConfigs(bill.id)).resolves.toBeUndefined();
  });
});
