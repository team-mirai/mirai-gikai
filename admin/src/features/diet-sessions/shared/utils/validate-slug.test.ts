import { describe, expect, it } from "vitest";
import { validateSlug } from "./validate-slug";

describe("validateSlug", () => {
  it("半角英小文字のみの場合、nullを返す", () => {
    expect(validateSlug("abc")).toBeNull();
  });

  it("半角数字のみの場合、nullを返す", () => {
    expect(validateSlug("123")).toBeNull();
  });

  it("ハイフンを含む場合、nullを返す", () => {
    expect(validateSlug("session-215")).toBeNull();
  });

  it("英小文字・数字・ハイフンの組み合わせの場合、nullを返す", () => {
    expect(validateSlug("diet-session-2024-01")).toBeNull();
  });

  it("nullの場合、nullを返す", () => {
    expect(validateSlug(null)).toBeNull();
  });

  it("undefinedの場合、nullを返す", () => {
    expect(validateSlug(undefined)).toBeNull();
  });

  it("空文字列の場合、nullを返す", () => {
    expect(validateSlug("")).toBeNull();
  });

  it("大文字を含む場合、エラーメッセージを返す", () => {
    expect(validateSlug("ABC")).toBe(
      "スラッグは半角英小文字、数字、ハイフンのみ使用できます"
    );
  });

  it("スペースを含む場合、エラーメッセージを返す", () => {
    expect(validateSlug("diet session")).toBe(
      "スラッグは半角英小文字、数字、ハイフンのみ使用できます"
    );
  });

  it("日本語を含む場合、エラーメッセージを返す", () => {
    expect(validateSlug("国会")).toBe(
      "スラッグは半角英小文字、数字、ハイフンのみ使用できます"
    );
  });

  it("アンダースコアを含む場合、エラーメッセージを返す", () => {
    expect(validateSlug("diet_session")).toBe(
      "スラッグは半角英小文字、数字、ハイフンのみ使用できます"
    );
  });
});
