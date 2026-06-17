import { describe, expect, it } from "vitest";
import { splitByQuote } from "./split-by-quote";

describe("splitByQuote", () => {
  it("quote が無ければ全体を1セグメントで返す", () => {
    expect(splitByQuote("本文です")).toEqual([
      { text: "本文です", highlight: false },
    ]);
    expect(splitByQuote("本文です", "  ")).toEqual([
      { text: "本文です", highlight: false },
    ]);
  });

  it("一致しなければ全体を1セグメントで返す", () => {
    expect(splitByQuote("本文です", "別の語")).toEqual([
      { text: "本文です", highlight: false },
    ]);
  });

  it("先頭一致: 一致部分 + 残りに分割する", () => {
    expect(splitByQuote("引用部分のあと続く", "引用部分")).toEqual([
      { text: "引用部分", highlight: true },
      { text: "のあと続く", highlight: false },
    ]);
  });

  it("中間一致: 前 + 一致 + 後に分割する", () => {
    expect(splitByQuote("前置き引用部分あとがき", "引用部分")).toEqual([
      { text: "前置き", highlight: false },
      { text: "引用部分", highlight: true },
      { text: "あとがき", highlight: false },
    ]);
  });

  it("末尾一致: 前 + 一致に分割する", () => {
    expect(splitByQuote("前置き引用部分", "引用部分")).toEqual([
      { text: "前置き", highlight: false },
      { text: "引用部分", highlight: true },
    ]);
  });

  it("最初の一致のみハイライトする", () => {
    expect(splitByQuote("AはAはA", "A")).toEqual([
      { text: "A", highlight: true },
      { text: "はAはA", highlight: false },
    ]);
  });
});
