import { describe, expect, it } from "vitest";
import type { BillStatusEnum } from "../types";
import { isBillSortKey, sortBills } from "./sort-bills";

function bill(
  id: string,
  overrides: {
    submitted_date?: string | null;
    updated_at?: string;
    status?: BillStatusEnum;
    publicReportCount?: number;
  } = {}
) {
  return {
    id,
    submitted_date: "2026-03-01",
    updated_at: "2026-03-01T00:00:00Z",
    status: "introduced" as BillStatusEnum,
    ...overrides,
  };
}

const ids = (bills: { id: string }[]) => bills.map((b) => b.id);

describe("isBillSortKey", () => {
  it("既知のキーだけ通す", () => {
    expect(isBillSortKey("new")).toBe(true);
    expect(isBillSortKey("status")).toBe(true);
    expect(isBillSortKey("voices")).toBe(true);
  });

  it("未知の値は弾く", () => {
    expect(isBillSortKey("popular")).toBe(false);
    expect(isBillSortKey(undefined)).toBe(false);
  });
});

describe("sortBills", () => {
  it("voices は回答数の多い順", () => {
    const result = sortBills(
      [
        bill("few", { publicReportCount: 3 }),
        bill("many", { publicReportCount: 412 }),
        bill("mid", { publicReportCount: 89 }),
      ],
      "voices"
    );

    expect(ids(result)).toEqual(["many", "mid", "few"]);
  });

  // 回答数を持たない議案を上位に出すと「集まっている順」の意味が壊れる。
  it("voices で回答数が未設定の議案は0扱いで沈む", () => {
    const result = sortBills(
      [bill("unknown"), bill("some", { publicReportCount: 1 })],
      "voices"
    );

    expect(ids(result)).toEqual(["some", "unknown"]);
  });

  it("new は提出日の新しい順", () => {
    const result = sortBills(
      [
        bill("old", { submitted_date: "2026-01-01" }),
        bill("new", { submitted_date: "2026-05-01" }),
        bill("mid", { submitted_date: "2026-03-01" }),
      ],
      "new"
    );

    expect(ids(result)).toEqual(["new", "mid", "old"]);
  });

  it("old は提出日の古い順", () => {
    const result = sortBills(
      [
        bill("new", { submitted_date: "2026-05-01" }),
        bill("old", { submitted_date: "2026-01-01" }),
      ],
      "old"
    );

    expect(ids(result)).toEqual(["old", "new"]);
  });

  // 提出日なしを先頭に出すと「新しい順」の意味が壊れる。
  it("提出日が無い法案は昇順でも降順でも最後尾にする", () => {
    const bills = [
      bill("none", { submitted_date: null }),
      bill("dated", { submitted_date: "2026-01-01" }),
    ];

    expect(ids(sortBills(bills, "new"))).toEqual(["dated", "none"]);
    expect(ids(sortBills(bills, "old"))).toEqual(["dated", "none"]);
  });

  it("updated は更新の新しい順", () => {
    const result = sortBills(
      [
        bill("stale", { updated_at: "2026-01-01T00:00:00Z" }),
        bill("fresh", { updated_at: "2026-07-01T00:00:00Z" }),
      ],
      "updated"
    );

    expect(ids(result)).toEqual(["fresh", "stale"]);
  });

  it("status は BILL_STATUS_ORDER に従う", () => {
    const result = sortBills(
      [
        bill("preparing", { status: "preparing" }),
        bill("enacted", { status: "enacted" }),
        bill("deliberating", { status: "in_originating_house" }),
      ],
      "status"
    );

    expect(ids(result)).toEqual(["enacted", "deliberating", "preparing"]);
  });

  it("同点は元の順序を保つ", () => {
    const result = sortBills(
      [
        bill("a", { submitted_date: "2026-03-01" }),
        bill("b", { submitted_date: "2026-03-01" }),
        bill("c", { submitted_date: "2026-03-01" }),
      ],
      "new"
    );

    expect(ids(result)).toEqual(["a", "b", "c"]);
  });

  it("元の配列を壊さない", () => {
    const input = [
      bill("a", { submitted_date: "2026-01-01" }),
      bill("b", { submitted_date: "2026-05-01" }),
    ];
    sortBills(input, "new");

    expect(ids(input)).toEqual(["a", "b"]);
  });

  it("空配列でも落ちない", () => {
    expect(sortBills([], "new")).toEqual([]);
  });
});
