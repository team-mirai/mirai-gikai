import { describe, expect, it } from "vitest";
import { escapeXml, sanitizeRate } from "./tts-utils";

describe("escapeXml", () => {
  it("& をエスケープする", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
  });

  it("< > をエスケープする", () => {
    expect(escapeXml("<div>")).toBe("&lt;div&gt;");
  });

  it('" をエスケープする', () => {
    expect(escapeXml('value="1"')).toBe("value=&quot;1&quot;");
  });

  it("' をエスケープする", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("複数の特殊文字を同時にエスケープする", () => {
    expect(escapeXml('<a href="url">A & B\'s</a>')).toBe(
      "&lt;a href=&quot;url&quot;&gt;A &amp; B&apos;s&lt;/a&gt;"
    );
  });

  it("特殊文字がない場合はそのまま返す", () => {
    expect(escapeXml("こんにちは")).toBe("こんにちは");
  });

  it("空文字列を処理できる", () => {
    expect(escapeXml("")).toBe("");
  });
});

describe("sanitizeRate", () => {
  it("undefined を渡すと undefined を返す", () => {
    expect(sanitizeRate(undefined)).toBeUndefined();
  });

  it("空文字を渡すと undefined を返す", () => {
    expect(sanitizeRate("")).toBeUndefined();
  });

  describe("有効な rate", () => {
    it('"+30%" を返す', () => {
      expect(sanitizeRate("+30%")).toBe("+30%");
    });

    it('"-20%" を返す', () => {
      expect(sanitizeRate("-20%")).toBe("-20%");
    });

    it('"0%" を返す', () => {
      expect(sanitizeRate("0%")).toBe("0%");
    });

    it('"+100%" を返す', () => {
      expect(sanitizeRate("+100%")).toBe("+100%");
    });

    it("符号なしの数値も受け付ける", () => {
      expect(sanitizeRate("50%")).toBe("50%");
    });
  });

  describe("無効な rate", () => {
    it("% なしの数値は undefined を返す", () => {
      expect(sanitizeRate("30")).toBeUndefined();
    });

    it("文字列は undefined を返す", () => {
      expect(sanitizeRate("fast")).toBeUndefined();
    });

    it("4桁以上の数値は undefined を返す", () => {
      expect(sanitizeRate("+1000%")).toBeUndefined();
    });

    it("小数は undefined を返す", () => {
      expect(sanitizeRate("+30.5%")).toBeUndefined();
    });

    it("スペースを含む場合は undefined を返す", () => {
      expect(sanitizeRate(" +30% ")).toBeUndefined();
    });
  });
});
