import { describe, expect, it } from "vitest";
import { chunkArray } from "./chunk-array";

describe("chunkArray", () => {
  it("空配列を返す", () => {
    expect(chunkArray([], 5)).toEqual([]);
  });

  it("配列をサイズごとに分割する", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("配列がサイズより小さい場合は1つのチャンクを返す", () => {
    expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("配列がサイズと等しい場合は1つのチャンクを返す", () => {
    expect(chunkArray([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it("サイズ1で分割する", () => {
    expect(chunkArray(["a", "b", "c"], 1)).toEqual([["a"], ["b"], ["c"]]);
  });

  it("サイズが0以下の場合はエラーを投げる", () => {
    expect(() => chunkArray([1], 0)).toThrow(
      "Chunk size must be greater than 0"
    );
    expect(() => chunkArray([1], -1)).toThrow(
      "Chunk size must be greater than 0"
    );
  });
});
