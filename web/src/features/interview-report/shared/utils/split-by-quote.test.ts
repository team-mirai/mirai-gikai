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

  it("「…」で省略結合された引用は各断片を出現順に太字化する", () => {
    expect(
      splitByQuote("前半部分があり中略され後半部分が続く", "前半部分…後半部分")
    ).toEqual([
      { text: "前半部分", highlight: true },
      { text: "があり中略され", highlight: false },
      { text: "後半部分", highlight: true },
      { text: "が続く", highlight: false },
    ]);
  });

  it('"..."区切りも断片として扱う', () => {
    expect(splitByQuote("ABCDEF", "AB...EF")).toEqual([
      { text: "AB", highlight: true },
      { text: "CD", highlight: false },
      { text: "EF", highlight: true },
    ]);
  });

  it("断片が見つからなければその断片はスキップする", () => {
    expect(splitByQuote("前半部分のみ", "前半部分…無い後半")).toEqual([
      { text: "前半部分", highlight: true },
      { text: "のみ", highlight: false },
    ]);
  });
});
