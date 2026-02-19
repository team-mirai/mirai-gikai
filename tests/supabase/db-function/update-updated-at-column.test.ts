import { describe, expect, it, afterEach } from "vitest";
import { adminClient, createTestBill, cleanupTestBill } from "../utils";

describe("update_updated_at_column トリガー", () => {
  let billId: string | undefined;

  afterEach(async () => {
    if (billId) {
      await cleanupTestBill(billId);
      billId = undefined;
    }
  });

  it("UPDATE 時に updated_at が自動で更新される", async () => {
    const bill = await createTestBill();
    billId = bill.id;
    const originalUpdatedAt = bill.updated_at;

    // 少し待ってから更新（タイムスタンプの差を確実にする）
    await new Promise((r) => setTimeout(r, 100));

    const { error } = await adminClient
      .from("bills")
      .update({ name: "更新後の議案名" })
      .eq("id", bill.id);
    expect(error).toBeNull();

    const { data: updated } = await adminClient
      .from("bills")
      .select("updated_at")
      .eq("id", bill.id)
      .single();

    expect(updated).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: expect で null チェック済み
    expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime()
    );
  });

  it("INSERT 時に updated_at にデフォルト値が設定される", async () => {
    const before = new Date();
    const bill = await createTestBill();
    billId = bill.id;
    const after = new Date();

    const updatedAt = new Date(bill.updated_at).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(updatedAt).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});
