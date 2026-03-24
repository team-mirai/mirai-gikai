import { describe, expect, it } from "vitest";
import { compileTemplate } from "./compile-template";

describe("compileTemplate", () => {
  it("テンプレート変数を値で置換する", () => {
    const result = compileTemplate("Hello {{name}}!", { name: "World" });
    expect(result).toBe("Hello World!");
  });

  it("複数の変数を置換する", () => {
    const result = compileTemplate("{{a}} and {{b}}", { a: "X", b: "Y" });
    expect(result).toBe("X and Y");
  });

  it("未定義の変数はそのまま残す", () => {
    const result = compileTemplate("Hello {{name}}!", {});
    expect(result).toBe("Hello {{name}}!");
  });

  it("変数なしの場合はテンプレートをそのまま返す", () => {
    const result = compileTemplate("No variables here");
    expect(result).toBe("No variables here");
  });

  it("同じ変数の複数出現を全て置換する", () => {
    const result = compileTemplate("{{x}} + {{x}}", { x: "1" });
    expect(result).toBe("1 + 1");
  });
});
