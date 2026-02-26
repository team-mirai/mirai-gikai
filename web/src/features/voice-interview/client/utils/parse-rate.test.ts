import { describe, expect, it } from "vitest";
import { parseRate } from "./parse-rate";

describe("parseRate", () => {
  it("undefined を渡すと 1.0 を返す", () => {
    expect(parseRate(undefined)).toBe(1.0);
  });

  it("空文字を渡すと 1.0 を返す", () => {
    expect(parseRate("")).toBe(1.0);
  });

  describe("パーセント指定", () => {
    it('"-20%" → 0.8', () => {
      expect(parseRate("-20%")).toBe(0.8);
    });

    it('"+30%" → 1.3', () => {
      expect(parseRate("+30%")).toBe(1.3);
    });

    it('"0%" → 1.0', () => {
      expect(parseRate("0%")).toBe(1.0);
    });

    it('"+100%" → 2.0', () => {
      expect(parseRate("+100%")).toBe(2.0);
    });

    it('"-50%" → 0.5', () => {
      expect(parseRate("-50%")).toBe(0.5);
    });

    it("不正なパーセント値は 1.0 を返す", () => {
      expect(parseRate("abc%")).toBe(1.0);
    });
  });

  describe("数値指定", () => {
    it('"1.5" → 1.5', () => {
      expect(parseRate("1.5")).toBe(1.5);
    });

    it('"0.8" → 0.8', () => {
      expect(parseRate("0.8")).toBe(0.8);
    });

    it('"2" → 2.0', () => {
      expect(parseRate("2")).toBe(2.0);
    });

    it("不正な数値は 1.0 を返す", () => {
      expect(parseRate("abc")).toBe(1.0);
    });
  });

  it("前後の空白を除去してパースする", () => {
    expect(parseRate("  +30%  ")).toBe(1.3);
    expect(parseRate("  1.5  ")).toBe(1.5);
  });
});
