import { describe, expect, it } from "vitest";
import { splitIntoRows } from "./split-into-rows";

describe("splitIntoRows", () => {
  it("列ごとに上から下へ詰める", () => {
    expect(splitIntoRows(["a", "b", "c", "d", "e"], 2)).toEqual([
      ["a", "c", "e"],
      ["b", "d"],
    ]);
  });

  it("行数を指定できる", () => {
    expect(splitIntoRows([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 4, 7],
      [2, 5],
      [3, 6],
    ]);
  });

  // タグが1件しかない画面でも行の数は変わらない。空行を返して呼び出し側の
  // map を単純に保つ。
  it("要素が足りなくても行数分の配列を返す", () => {
    expect(splitIntoRows(["a"], 2)).toEqual([["a"], []]);
  });

  it("空配列なら空の行を返す", () => {
    expect(splitIntoRows([], 2)).toEqual([[], []]);
  });

  it("行数が0以下なら空", () => {
    expect(splitIntoRows(["a", "b"], 0)).toEqual([]);
    expect(splitIntoRows(["a", "b"], -1)).toEqual([]);
  });

  it("行数が整数でなければ空", () => {
    expect(splitIntoRows(["a", "b"], 1.5)).toEqual([]);
    expect(splitIntoRows(["a", "b"], Number.NaN)).toEqual([]);
    expect(splitIntoRows(["a", "b"], Number.POSITIVE_INFINITY)).toEqual([]);
  });

  it("元の配列を壊さない", () => {
    const input = ["a", "b", "c"];
    splitIntoRows(input, 2);
    expect(input).toEqual(["a", "b", "c"]);
  });
});
