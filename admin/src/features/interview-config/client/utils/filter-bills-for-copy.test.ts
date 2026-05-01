import { describe, expect, it } from "vitest";
import { filterBillsForCopy } from "./filter-bills-for-copy";

const bills = [
  { id: "a", name: "デジタル社会形成基本法案" },
  { id: "b", name: "労働基準法改正案" },
  { id: "c", name: "ALPS処理水関連法案" },
  { id: "d", name: "Energy Policy Act" },
];

describe("filterBillsForCopy", () => {
  it("currentBillId は常に除外される", () => {
    const result = filterBillsForCopy(bills, "a", "");
    expect(result.map((b) => b.id)).toEqual(["b", "c", "d"]);
  });

  it("空クエリでは currentBillId 以外を全て返す", () => {
    const result = filterBillsForCopy(bills, "x", "");
    expect(result).toHaveLength(4);
  });

  it("前後の空白は無視される", () => {
    const result = filterBillsForCopy(bills, "x", "  労働  ");
    expect(result.map((b) => b.id)).toEqual(["b"]);
  });

  it("大文字小文字を無視して部分一致する", () => {
    const result = filterBillsForCopy(bills, "x", "energy");
    expect(result.map((b) => b.id)).toEqual(["d"]);
  });

  it("クエリが対象 bill の name に含まれる場合のみ一致する", () => {
    const result = filterBillsForCopy(bills, "x", "ALPS");
    expect(result.map((b) => b.id)).toEqual(["c"]);
  });

  it("該当がない場合は空配列を返す", () => {
    const result = filterBillsForCopy(bills, "x", "存在しない");
    expect(result).toEqual([]);
  });

  it("currentBillId に該当する bill 名にクエリが含まれていても除外される", () => {
    const result = filterBillsForCopy(bills, "a", "デジタル");
    expect(result).toEqual([]);
  });
});
