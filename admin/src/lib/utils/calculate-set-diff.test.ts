import { describe, expect, it } from "vitest";
import { calculateSetDiff } from "./calculate-set-diff";

describe("calculateSetDiff", () => {
  it("追加と削除の両方がある場合", () => {
    const result = calculateSetDiff(["a", "b", "c"], ["b", "c", "d"]);
    expect(result.toAdd).toEqual(["d"]);
    expect(result.toDelete).toEqual(["a"]);
  });

  it("追加のみの場合", () => {
    const result = calculateSetDiff(["a"], ["a", "b", "c"]);
    expect(result.toAdd).toEqual(["b", "c"]);
    expect(result.toDelete).toEqual([]);
  });

  it("削除のみの場合", () => {
    const result = calculateSetDiff(["a", "b", "c"], ["a"]);
    expect(result.toAdd).toEqual([]);
    expect(result.toDelete).toEqual(["b", "c"]);
  });

  it("変更なしの場合", () => {
    const result = calculateSetDiff(["a", "b"], ["a", "b"]);
    expect(result.toAdd).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it("両方空の場合", () => {
    const result = calculateSetDiff([], []);
    expect(result.toAdd).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it("既存が空で追加のみの場合", () => {
    const result = calculateSetDiff([], ["a", "b"]);
    expect(result.toAdd).toEqual(["a", "b"]);
    expect(result.toDelete).toEqual([]);
  });

  it("数値でも動作する", () => {
    const result = calculateSetDiff([1, 2, 3], [2, 3, 4]);
    expect(result.toAdd).toEqual([4]);
    expect(result.toDelete).toEqual([1]);
  });
});
