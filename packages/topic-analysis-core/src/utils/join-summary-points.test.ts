import { describe, expect, it } from "vitest";
import { joinSummaryPoints } from "./join-summary-points";

describe("joinSummaryPoints", () => {
  it("要点配列を改行区切りで結合する", () => {
    expect(
      joinSummaryPoints(["1文目。", "2文目。", "3文目。"])
    ).toBe("1文目。\n2文目。\n3文目。");
  });

  it("各要素を trim し空要素を除去する", () => {
    expect(joinSummaryPoints(["  a  ", "", "  ", "b"])).toBe("a\nb");
  });

  it("最大3件に丸める", () => {
    expect(joinSummaryPoints(["1", "2", "3", "4"])).toBe("1\n2\n3");
  });

  it("空配列は空文字を返す", () => {
    expect(joinSummaryPoints([])).toBe("");
  });
});
