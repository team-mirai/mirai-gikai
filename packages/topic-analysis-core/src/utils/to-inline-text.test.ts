import { describe, expect, it } from "vitest";
import { toInlineText } from "./to-inline-text";

describe("toInlineText", () => {
  it("改行を単一スペースに畳む", () => {
    const input = "1文目。\n2文目。\n3文目。";
    expect(toInlineText(input)).toBe("1文目。 2文目。 3文目。");
  });

  it("連続する空白・改行をまとめる", () => {
    expect(toInlineText("a  \n\n  b")).toBe("a b");
  });

  it("前後の空白を除去する", () => {
    expect(toInlineText("  text  \n")).toBe("text");
  });

  it("改行を含まない文字列はそのまま返す", () => {
    expect(toInlineText("単一行の説明")).toBe("単一行の説明");
  });

  it("空文字は空文字のまま", () => {
    expect(toInlineText("")).toBe("");
  });
});
