import { describe, expect, it } from "vitest";
import { truncateText } from "./truncate-text";

describe("truncateText", () => {
  it("短いテキストはそのまま返す", () => {
    expect(truncateText("こんにちは", 10)).toBe("こんにちは");
  });

  it("上限と同じ長さのテキストはそのまま返す", () => {
    expect(truncateText("12345", 5)).toBe("12345");
  });

  it("上限を超えるテキストは切り詰めて...を付ける", () => {
    expect(truncateText("1234567890", 5)).toBe("12345...");
  });

  it("空文字列はそのまま返す", () => {
    expect(truncateText("", 10)).toBe("");
  });

  it("日本語テキストでも正しく切り詰める", () => {
    const text =
      "中小企業の立場から、荷主一強の業界構造において電子化がさらなる不利益をもたらす可能性を危惧しています。";
    const result = truncateText(text, 20);
    expect(result).toBe("中小企業の立場から、荷主一強の業界構造に...");
    expect(result.length).toBe(23); // 20文字 + "..."(3文字)
  });
});
