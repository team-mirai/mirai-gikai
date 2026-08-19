import { describe, expect, it } from "vitest";
import type { BillStatusEnum } from "../types";
import {
  countByStatusGroup,
  filterByStatusGroup,
  isBillStatusGroup,
  toBillStatusGroup,
} from "./bill-status-group";

const bill = (status: BillStatusEnum) => ({ status });

describe("toBillStatusGroup", () => {
  it("衆参どちらの審議中も「審議中」に畳む", () => {
    expect(toBillStatusGroup("in_originating_house")).toBe("deliberating");
    expect(toBillStatusGroup("in_receiving_house")).toBe("deliberating");
  });

  // preparing と introduced はどちらも審議が始まっていない状態。
  it("提出前と提出済みは「審議待ち」に寄せる", () => {
    expect(toBillStatusGroup("preparing")).toBe("waiting");
    expect(toBillStatusGroup("introduced")).toBe("waiting");
  });

  it("成立と否決はそのまま", () => {
    expect(toBillStatusGroup("enacted")).toBe("enacted");
    expect(toBillStatusGroup("rejected")).toBe("rejected");
  });
});

describe("isBillStatusGroup", () => {
  it("既知のグループだけ通す", () => {
    expect(isBillStatusGroup("all")).toBe(true);
    expect(isBillStatusGroup("deliberating")).toBe(true);
  });

  it("未知の値は弾く", () => {
    expect(isBillStatusGroup("introduced")).toBe(false);
    expect(isBillStatusGroup(undefined)).toBe(false);
    expect(isBillStatusGroup(3)).toBe(false);
  });
});

describe("countByStatusGroup", () => {
  it("グループごとに数え、all は総数にする", () => {
    const counts = countByStatusGroup([
      bill("in_originating_house"),
      bill("in_receiving_house"),
      bill("introduced"),
      bill("preparing"),
      bill("enacted"),
      bill("rejected"),
    ]);

    expect(counts).toEqual({
      all: 6,
      deliberating: 2,
      waiting: 2,
      enacted: 1,
      rejected: 1,
    });
  });

  it("空なら全て0", () => {
    expect(countByStatusGroup([])).toEqual({
      all: 0,
      deliberating: 0,
      waiting: 0,
      enacted: 0,
      rejected: 0,
    });
  });
});

describe("filterByStatusGroup", () => {
  const bills = [
    bill("in_originating_house"),
    bill("enacted"),
    bill("introduced"),
  ];

  it("all は素通しする", () => {
    expect(filterByStatusGroup(bills, "all")).toHaveLength(3);
  });

  it("指定グループだけ残す", () => {
    expect(filterByStatusGroup(bills, "enacted")).toEqual([bill("enacted")]);
  });

  it("該当が無ければ空", () => {
    expect(filterByStatusGroup(bills, "rejected")).toEqual([]);
  });

  it("元の配列を壊さない", () => {
    const input = [bill("enacted")];
    filterByStatusGroup(input, "all").push(bill("rejected"));
    expect(input).toHaveLength(1);
  });
});
