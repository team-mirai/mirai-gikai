import { afterEach, describe, expect, it } from "vitest";
import { adminClient, cleanupTestBill, createTestBill } from "../utils";

async function fetchStatusChanges(billId: string) {
  const { data, error } = await adminClient
    .from("bill_status_changes")
    .select("from_status, to_status")
    .eq("bill_id", billId)
    .order("changed_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

async function updateStatus(
  billId: string,
  status: "in_originating_house" | "in_receiving_house"
) {
  const { error } = await adminClient
    .from("bills")
    .update({ status })
    .eq("id", billId);
  if (error) throw new Error(`bill 更新失敗: ${error.message}`);
}

describe("record_bill_status_change トリガー", () => {
  const billIds: string[] = [];

  afterEach(async () => {
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  it("作成時と status を変えたときに行が入り、同じ値への更新では入らない", async () => {
    const bill = await createTestBill({ status: "introduced" });
    billIds.push(bill.id);

    await updateStatus(bill.id, "in_originating_house");
    await updateStatus(bill.id, "in_originating_house");
    await updateStatus(bill.id, "in_receiving_house");

    expect(await fetchStatusChanges(bill.id)).toEqual([
      { from_status: null, to_status: "introduced" },
      { from_status: "introduced", to_status: "in_originating_house" },
      { from_status: "in_originating_house", to_status: "in_receiving_house" },
    ]);
  });

  it("status 以外の列の更新では行が入らない", async () => {
    const bill = await createTestBill({ status: "introduced" });
    billIds.push(bill.id);

    await adminClient
      .from("bills")
      .update({ name: "名前を変更" })
      .eq("id", bill.id);

    expect(await fetchStatusChanges(bill.id)).toEqual([
      { from_status: null, to_status: "introduced" },
    ]);
  });
});
