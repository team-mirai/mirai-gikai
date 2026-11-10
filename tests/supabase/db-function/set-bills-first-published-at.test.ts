import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "../../../packages/supabase/types/supabase.types";
import { adminClient, cleanupTestBill, createTestBill } from "../utils";

type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];

async function updateBill(billId: string, patch: BillUpdate) {
  const { data, error } = await adminClient
    .from("bills")
    .update(patch)
    .eq("id", billId)
    .select("first_published_at")
    .single();
  if (error) throw new Error(`bill 更新失敗: ${error.message}`);
  return data.first_published_at;
}

describe("set_bills_first_published_at トリガー", () => {
  const billIds: string[] = [];

  async function createBill(overrides: Parameters<typeof createTestBill>[0]) {
    const bill = await createTestBill(overrides);
    billIds.push(bill.id);
    return bill;
  }

  afterEach(async () => {
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  it("公開状態で作成すると first_published_at が入る", async () => {
    const bill = await createBill({ publish_status: "published" });
    expect(bill.first_published_at).not.toBeNull();
  });

  it("公開すると first_published_at が入り、非公開に戻してから再公開しても変わらない", async () => {
    const bill = await createBill({ publish_status: "draft" });
    expect(bill.first_published_at).toBeNull();

    const first = await updateBill(bill.id, { publish_status: "published" });
    expect(first).not.toBeNull();

    await updateBill(bill.id, { publish_status: "draft" });
    expect(await updateBill(bill.id, { publish_status: "published" })).toBe(
      first
    );
  });

  it("first_published_at を直接書き換えようとしても trigger の値が残る", async () => {
    const draft = await createBill({ publish_status: "draft" });
    expect(
      await updateBill(draft.id, {
        first_published_at: "2000-01-01T00:00:00+00:00",
      })
    ).toBeNull();

    const published = await createBill({ publish_status: "published" });
    expect(await updateBill(published.id, { first_published_at: null })).toBe(
      published.first_published_at
    );
  });
});
