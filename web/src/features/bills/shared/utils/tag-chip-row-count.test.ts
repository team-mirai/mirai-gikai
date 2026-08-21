import { describe, expect, it } from "vitest";
import { tagChipRowCount } from "./tag-chip-row-count";

describe("tagChipRowCount", () => {
  // 絞り込みでチップが減ったときに縦積みにならないようにする。
  it("少ないときは1行", () => {
    expect(tagChipRowCount(0)).toBe(1);
    expect(tagChipRowCount(1)).toBe(1);
    expect(tagChipRowCount(4)).toBe(1);
  });

  it("上限までは1行", () => {
    expect(tagChipRowCount(6)).toBe(1);
  });

  it("上限を超えたら2行", () => {
    expect(tagChipRowCount(7)).toBe(2);
  });

  // 本番のタグは18件。
  it("多いときは2行のまま", () => {
    expect(tagChipRowCount(18)).toBe(2);
  });
});
