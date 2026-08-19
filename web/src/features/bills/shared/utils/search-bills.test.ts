import { describe, expect, it } from "vitest";
import { searchBills } from "./search-bills";

function bill(
  id: string,
  overrides: {
    name?: string;
    title?: string | null;
    summary?: string | null;
    tags?: string[];
  } = {}
) {
  return {
    id,
    name: overrides.name ?? "揮発油税等の暫定税率の廃止等に関する法律案",
    bill_content:
      overrides.title === null && overrides.summary === null
        ? undefined
        : ({
            title: overrides.title ?? "ガソリン税の上乗せをやめる法案",
            summary: overrides.summary ?? "暫定税率を廃止します。",
          } as never),
    tags: (overrides.tags ?? ["税金"]).map((label) => ({ id: label, label })),
  };
}

const ids = (bills: { id: string }[]) => bills.map((b) => b.id);

describe("searchBills", () => {
  it("正式名称に当てる", () => {
    expect(ids(searchBills([bill("a")], "揮発油税"))).toEqual(["a"]);
  });

  it("わかりやすいタイトルに当てる", () => {
    expect(ids(searchBills([bill("a")], "ガソリン"))).toEqual(["a"]);
  });

  it("要約に当てる", () => {
    expect(ids(searchBills([bill("a")], "暫定税率"))).toEqual(["a"]);
  });

  // カテゴリ名で探す利用者がいる。
  it("タグ名に当てる", () => {
    expect(
      ids(searchBills([bill("a", { tags: ["暮らし"] })], "暮らし"))
    ).toEqual(["a"]);
  });

  it("一致しなければ空", () => {
    expect(searchBills([bill("a")], "宇宙")).toEqual([]);
  });

  it("空クエリは絞り込まない", () => {
    const bills = [bill("a"), bill("b")];
    expect(ids(searchBills(bills, ""))).toEqual(["a", "b"]);
    expect(ids(searchBills(bills, "   "))).toEqual(["a", "b"]);
  });

  // 「AI」を「ＡＩ」と打つ利用者を取りこぼさない。
  it("全角と半角を同一視する", () => {
    const target = bill("a", { title: "AIの活用を進める法案" });
    expect(ids(searchBills([target], "ＡＩ"))).toEqual(["a"]);
    expect(ids(searchBills([target], "ai"))).toEqual(["a"]);
  });

  it("クエリ中の空白を無視する", () => {
    expect(ids(searchBills([bill("a")], "ガソリン 税"))).toEqual(["a"]);
  });

  it("bill_content が無くても落ちない", () => {
    const target = bill("a", { title: null, summary: null });
    expect(ids(searchBills([target], "揮発油税"))).toEqual(["a"]);
    expect(searchBills([target], "ガソリン")).toEqual([]);
  });

  it("元の配列を壊さない", () => {
    const input = [bill("a")];
    searchBills(input, "").push(bill("b"));
    expect(input).toHaveLength(1);
  });
});
