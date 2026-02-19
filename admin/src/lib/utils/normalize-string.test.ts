import { describe, expect, it } from "vitest";
import { trimOrNull } from "./normalize-string";

describe("trimOrNull", () => {
  it("通常の文字列の場合、trimした結果を返す", () => {
    expect(trimOrNull("hello")).toBe("hello");
  });

  it("前後にスペースがある場合、trimした結果を返す", () => {
    expect(trimOrNull("  hello  ")).toBe("hello");
  });

  it("空文字列の場合、nullを返す", () => {
    expect(trimOrNull("")).toBeNull();
  });

  it("スペースのみの場合、nullを返す", () => {
    expect(trimOrNull("   ")).toBeNull();
  });

  it("nullの場合、nullを返す", () => {
    expect(trimOrNull(null)).toBeNull();
  });

  it("undefinedの場合、nullを返す", () => {
    expect(trimOrNull(undefined)).toBeNull();
  });

  it("タブやニューラインを含む場合、trimした結果を返す", () => {
    expect(trimOrNull("\t hello \n")).toBe("hello");
  });

  it("タブのみの場合、nullを返す", () => {
    expect(trimOrNull("\t\t")).toBeNull();
  });
});
