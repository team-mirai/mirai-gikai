import { describe, expect, it } from "vitest";
import { buildSnippet } from "./build-snippet";

describe("buildSnippet", () => {
  it("短いテキストは全体をそのまま返す", () => {
    expect(buildSnippet("子育て支援に賛成です", "子育て")).toBe(
      "子育て支援に賛成です"
    );
  });

  it("一致箇所の前後を radius 文字で切り出し省略記号を付ける", () => {
    const content = `${"あ".repeat(50)}子育て${"い".repeat(50)}`;
    const snippet = buildSnippet(content, "子育て", 10);
    expect(snippet).toBe(`…${"あ".repeat(10)}子育て${"い".repeat(10)}…`);
  });

  it("一致箇所が先頭付近の場合は前方の省略記号を付けない", () => {
    const content = `子育て${"い".repeat(100)}`;
    const snippet = buildSnippet(content, "子育て", 10);
    expect(snippet).toBe(`子育て${"い".repeat(10)}…`);
  });

  it("一致箇所が末尾付近の場合は後方の省略記号を付けない", () => {
    const content = `${"あ".repeat(100)}子育て`;
    const snippet = buildSnippet(content, "子育て", 10);
    expect(snippet).toBe(`…${"あ".repeat(10)}子育て`);
  });

  it("大文字小文字を区別せず一致箇所を探す", () => {
    const content = `${"a".repeat(50)}KEYWORD${"b".repeat(50)}`;
    const snippet = buildSnippet(content, "keyword", 5);
    expect(snippet).toBe("…aaaaaKEYWORDbbbbb…");
  });

  it("一致しない場合は先頭から radius * 2 文字を返す", () => {
    const content = "あ".repeat(100);
    expect(buildSnippet(content, "子育て", 10)).toBe(`${"あ".repeat(20)}…`);
  });

  it("一致せずテキストが短い場合は全体を返す", () => {
    expect(buildSnippet("短いテキスト", "子育て", 10)).toBe("短いテキスト");
  });
});
