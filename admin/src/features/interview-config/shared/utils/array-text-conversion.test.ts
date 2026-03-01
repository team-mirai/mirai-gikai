import { describe, expect, it } from "vitest";
import { arrayToText, textToArray } from "./array-text-conversion";

describe("textToArray", () => {
  it("改行区切りテキストを配列に変換する", () => {
    expect(textToArray("aaa\nbbb\nccc")).toEqual(["aaa", "bbb", "ccc"]);
  });

  it("空行をフィルタする", () => {
    expect(textToArray("aaa\n\nbbb\n\n")).toEqual(["aaa", "bbb"]);
  });

  it("各行をトリムする", () => {
    expect(textToArray("  aaa  \n  bbb  ")).toEqual(["aaa", "bbb"]);
  });

  it("nullの場合は空配列を返す", () => {
    expect(textToArray(null)).toEqual([]);
  });

  it("undefinedの場合は空配列を返す", () => {
    expect(textToArray(undefined)).toEqual([]);
  });

  it("空文字列の場合は空配列を返す", () => {
    expect(textToArray("")).toEqual([]);
  });
});

describe("arrayToText", () => {
  it("配列を改行区切りテキストに変換する", () => {
    expect(arrayToText(["aaa", "bbb", "ccc"])).toBe("aaa\nbbb\nccc");
  });

  it("nullの場合は空文字列を返す", () => {
    expect(arrayToText(null)).toBe("");
  });

  it("undefinedの場合は空文字列を返す", () => {
    expect(arrayToText(undefined)).toBe("");
  });

  it("空配列の場合は空文字列を返す", () => {
    expect(arrayToText([])).toBe("");
  });

  it("1要素の配列はそのまま返す", () => {
    expect(arrayToText(["aaa"])).toBe("aaa");
  });
});
