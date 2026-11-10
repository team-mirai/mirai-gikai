import { describe, expect, it } from "vitest";
import { groupByBillId } from "./group-by-bill-id";

describe("groupByBillId", () => {
  it("bill_id ごとにまとめ、bill_id を除いて元の並び順を保つ", () => {
    const grouped = groupByBillId([
      { bill_id: "a", value: 1 },
      { bill_id: "b", value: 2 },
      { bill_id: "a", value: 3 },
    ]);
    expect([...grouped.entries()]).toEqual([
      ["a", [{ value: 1 }, { value: 3 }]],
      ["b", [{ value: 2 }]],
    ]);
  });

  it("空なら空の Map を返す", () => {
    expect(groupByBillId([]).size).toBe(0);
  });
});
