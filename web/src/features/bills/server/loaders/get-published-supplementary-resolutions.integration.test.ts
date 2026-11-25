import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "@test-utils/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

// unstable_cache はモジュール初期化時に評価されるため、
// テストファイル内で vi.mock → 動的インポートの順序を保証する必要がある。
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));
const { getPublishedSupplementaryResolutions } = await import(
  "./get-published-supplementary-resolutions"
);

describe("getPublishedSupplementaryResolutions 統合テスト", () => {
  const billIds: string[] = [];

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
  });

  it("公開済みの附帯決議だけを衆議院→参議院の順で返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const { error } = await adminClient
      .from("bill_supplementary_resolutions")
      .insert([
        {
          bill_id: bill.id,
          house: "HC",
          stance: "against",
          content: "参議院の附帯決議",
          is_published: true,
        },
        {
          bill_id: bill.id,
          house: "HR",
          stance: "for",
          content: "衆議院の附帯決議",
          is_published: true,
        },
      ]);
    expect(error).toBeNull();

    const result = await getPublishedSupplementaryResolutions(bill.id);

    expect(result.map((r) => [r.house, r.stance, r.content])).toEqual([
      ["HR", "for", "衆議院の附帯決議"],
      ["HC", "against", "参議院の附帯決議"],
    ]);
  });

  it("非公開の附帯決議は返さない", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const { error } = await adminClient
      .from("bill_supplementary_resolutions")
      .insert({ bill_id: bill.id, house: "HR", stance: "for" });
    expect(error).toBeNull();

    expect(await getPublishedSupplementaryResolutions(bill.id)).toEqual([]);
  });
});
