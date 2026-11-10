import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "../../../packages/supabase/types/supabase.types";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
  createTestMiraiStance,
} from "../utils";

type StanceUpdate = Database["public"]["Tables"]["mirai_stances"]["Update"];

async function updateStance(billId: string, patch: StanceUpdate) {
  const { data, error } = await adminClient
    .from("mirai_stances")
    .update(patch)
    .eq("bill_id", billId)
    .select("published_at")
    .single();
  if (error) throw new Error(`mirai_stances 更新失敗: ${error.message}`);
  return data.published_at;
}

describe("set_mirai_stances_published_at トリガー", () => {
  const billIds: string[] = [];

  async function createBillId() {
    const bill = await createTestBill();
    billIds.push(bill.id);
    return bill.id;
  }

  afterEach(async () => {
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  it("公開すると published_at が入り、非公開に戻すと消える", async () => {
    const billId = await createBillId();
    const stance = await createTestMiraiStance(billId, {
      is_published: false,
    });
    expect(stance.published_at).toBeNull();

    expect(await updateStance(billId, { is_published: true })).not.toBeNull();
    expect(await updateStance(billId, { is_published: false })).toBeNull();
  });

  it("公開状態で作成すると published_at が入り、他の列の更新や直接の書き換えでは変わらない", async () => {
    const billId = await createBillId();
    const stance = await createTestMiraiStance(billId, { is_published: true });
    expect(stance.published_at).not.toBeNull();

    expect(
      await updateStance(billId, {
        comment: "コメントを変更",
        published_at: null,
      })
    ).toBe(stance.published_at);
  });

  it("予約公開中の賛否を即時公開に変えると published_at が今の日時になる", async () => {
    const billId = await createBillId();
    const stance = await createTestMiraiStance(billId, {
      is_published: true,
      publish_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(stance.published_at).not.toBeNull();

    const published = await updateStance(billId, { publish_at: null });
    expect(new Date(published ?? "").getTime()).toBeGreaterThan(
      new Date(stance.published_at ?? "").getTime()
    );
  });
});
