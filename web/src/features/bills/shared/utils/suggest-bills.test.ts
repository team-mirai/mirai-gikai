import { describe, expect, it } from "vitest";
import { type SuggestableBill, suggestBills } from "./suggest-bills";

function bill(id: string, title = "ガソリン税を安くする法案"): SuggestableBill {
  return {
    id,
    name: "揮発油税等の暫定税率の廃止等に関する法律案",
    bill_content: { title },
    tags: [{ id: "zeikin", label: "税金" }],
  };
}

// マッチ規則そのものは searchBills 側でテストしている。ここは suggestBills が
// 足している振る舞いだけを見る。
describe("suggestBills", () => {
  it("一致した議案を返す", () => {
    expect(suggestBills([bill("a")], "ガソリン").map((b) => b.id)).toEqual([
      "a",
    ]);
  });

  it("空クエリでは候補を出さない", () => {
    const bills = [bill("a"), bill("b")];
    expect(suggestBills(bills, "")).toEqual([]);
    expect(suggestBills(bills, "   ")).toEqual([]);
  });

  // 候補が縦に伸びるとモーダルが画面を覆う。
  it("上限で打ち切る", () => {
    const bills = Array.from({ length: 10 }, (_, i) => bill(String(i)));
    expect(suggestBills(bills, "ガソリン")).toHaveLength(6);
  });

  it("一致しなければ空", () => {
    expect(suggestBills([bill("a")], "宇宙")).toEqual([]);
  });

  it("元の配列を壊さない", () => {
    const input = [bill("a"), bill("b")];
    suggestBills(input, "ガソリン");
    expect(input).toHaveLength(2);
  });
});
