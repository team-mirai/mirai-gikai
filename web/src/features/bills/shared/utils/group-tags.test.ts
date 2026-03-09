import { describe, expect, it } from "vitest";
import { groupTagsByBillId } from "./group-tags";

type BillTag = {
  bill_id: string;
  tags: { id: string; label: string } | null;
};

describe("groupTagsByBillId", () => {
  it("空配列のとき空のMapを返す", () => {
    const result = groupTagsByBillId([]);
    expect(result.size).toBe(0);
  });

  it("tags=null のエントリはスキップする", () => {
    const input: BillTag[] = [{ bill_id: "bill-1", tags: null }];
    const result = groupTagsByBillId(input);
    expect(result.size).toBe(0);
  });

  it("単一のbill_idに複数タグをグループ化する", () => {
    const input: BillTag[] = [
      { bill_id: "bill-1", tags: { id: "t1", label: "経済" } },
      { bill_id: "bill-1", tags: { id: "t2", label: "外交" } },
    ];
    const result = groupTagsByBillId(input);
    expect(result.size).toBe(1);
    expect(result.get("bill-1")).toEqual([
      { id: "t1", label: "経済" },
      { id: "t2", label: "外交" },
    ]);
  });

  it("複数のbill_idに対してそれぞれタグをグループ化する", () => {
    const input: BillTag[] = [
      { bill_id: "bill-1", tags: { id: "t1", label: "経済" } },
      { bill_id: "bill-2", tags: { id: "t2", label: "外交" } },
      { bill_id: "bill-1", tags: { id: "t3", label: "福祉" } },
    ];
    const result = groupTagsByBillId(input);
    expect(result.size).toBe(2);
    expect(result.get("bill-1")).toEqual([
      { id: "t1", label: "経済" },
      { id: "t3", label: "福祉" },
    ]);
    expect(result.get("bill-2")).toEqual([{ id: "t2", label: "外交" }]);
  });

  it("tags=null が混在していても有効なタグだけグループ化する", () => {
    const input: BillTag[] = [
      { bill_id: "bill-1", tags: { id: "t1", label: "経済" } },
      { bill_id: "bill-1", tags: null },
      { bill_id: "bill-2", tags: null },
      { bill_id: "bill-2", tags: { id: "t2", label: "外交" } },
    ];
    const result = groupTagsByBillId(input);
    expect(result.size).toBe(2);
    expect(result.get("bill-1")).toEqual([{ id: "t1", label: "経済" }]);
    expect(result.get("bill-2")).toEqual([{ id: "t2", label: "外交" }]);
  });
});
