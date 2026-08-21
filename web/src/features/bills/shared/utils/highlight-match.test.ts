import { describe, expect, it } from "vitest";
import { highlightMatch } from "./highlight-match";

describe("highlightMatch", () => {
  it("一致箇所の前後で分ける", () => {
    expect(highlightMatch("ガソリン税を安くする法案", "税")).toEqual([
      { text: "ガソリン", matched: false },
      { text: "税", matched: true },
      { text: "を安くする法案", matched: false },
    ]);
  });

  it("先頭が一致したら前の断片を作らない", () => {
    expect(highlightMatch("ガソリン税の法案", "ガソリン")).toEqual([
      { text: "ガソリン", matched: true },
      { text: "税の法案", matched: false },
    ]);
  });

  it("末尾が一致したら後の断片を作らない", () => {
    expect(highlightMatch("ガソリン税の法案", "法案")).toEqual([
      { text: "ガソリン税の", matched: false },
      { text: "法案", matched: true },
    ]);
  });

  it("大小文字を無視する", () => {
    expect(highlightMatch("AIの活用を進める法案", "ai")).toEqual([
      { text: "AI", matched: true },
      { text: "の活用を進める法案", matched: false },
    ]);
  });

  // タグ名や要約で当たった候補は、タイトルに一致箇所が無い。
  it("見つからなければ分けない", () => {
    expect(highlightMatch("ガソリン税の法案", "暮らし")).toEqual([
      { text: "ガソリン税の法案", matched: false },
    ]);
  });

  it("空クエリなら分けない", () => {
    expect(highlightMatch("ガソリン税の法案", "   ")).toEqual([
      { text: "ガソリン税の法案", matched: false },
    ]);
  });

  it("全文が一致したら1つの断片にする", () => {
    expect(highlightMatch("法案", "法案")).toEqual([
      { text: "法案", matched: true },
    ]);
  });
});
