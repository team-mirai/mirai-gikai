import { describe, expect, it } from "vitest";
import { splitTextByQuery } from "./split-text-by-query";

describe("splitTextByQuery", () => {
  it("一致部分と非一致部分に分割する", () => {
    expect(splitTextByQuery("保育園の待機児童問題", "待機児童")).toEqual([
      { text: "保育園の", isMatch: false },
      { text: "待機児童", isMatch: true },
      { text: "問題", isMatch: false },
    ]);
  });

  it("複数の一致箇所をすべて分割する", () => {
    expect(splitTextByQuery("支援と支援策", "支援")).toEqual([
      { text: "支援", isMatch: true },
      { text: "と", isMatch: false },
      { text: "支援", isMatch: true },
      { text: "策", isMatch: false },
    ]);
  });

  it("大文字小文字を区別せず一致し、元の表記を保持する", () => {
    expect(splitTextByQuery("AI と ai の議論", "Ai")).toEqual([
      { text: "AI", isMatch: true },
      { text: " と ", isMatch: false },
      { text: "ai", isMatch: true },
      { text: " の議論", isMatch: false },
    ]);
  });

  it("先頭・末尾が一致する場合も正しく分割する", () => {
    expect(splitTextByQuery("支援", "支援")).toEqual([
      { text: "支援", isMatch: true },
    ]);
  });

  it("一致しない場合は全体を非一致として返す", () => {
    expect(splitTextByQuery("高齢者福祉", "子育て")).toEqual([
      { text: "高齢者福祉", isMatch: false },
    ]);
  });

  it("検索語が空白のみの場合は全体を非一致として返す", () => {
    expect(splitTextByQuery("テキスト", "  ")).toEqual([
      { text: "テキスト", isMatch: false },
    ]);
  });

  it("検索語の前後の空白は無視して一致させる", () => {
    expect(splitTextByQuery("子育て支援", " 支援 ")).toEqual([
      { text: "子育て", isMatch: false },
      { text: "支援", isMatch: true },
    ]);
  });

  it("テキストが空の場合は空の非一致セグメントを返す", () => {
    expect(splitTextByQuery("", "支援")).toEqual([
      { text: "", isMatch: false },
    ]);
  });
});
