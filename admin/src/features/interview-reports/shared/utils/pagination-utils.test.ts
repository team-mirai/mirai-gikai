import { describe, expect, it } from "vitest";
import {
  calculatePaginationRange,
  generatePageNumbers,
} from "./pagination-utils";

describe("calculatePaginationRange", () => {
  it("1ページ目のoffsetは0", () => {
    expect(calculatePaginationRange(1, 30)).toEqual({ from: 0, to: 29 });
  });

  it("2ページ目のoffsetはperPage", () => {
    expect(calculatePaginationRange(2, 30)).toEqual({ from: 30, to: 59 });
  });

  it("3ページ目（perPage=10）", () => {
    expect(calculatePaginationRange(3, 10)).toEqual({ from: 20, to: 29 });
  });
});

describe("generatePageNumbers", () => {
  it("totalPages <= 5 の場合はすべてのページを返す", () => {
    expect(generatePageNumbers(3, 1)).toEqual([1, 2, 3]);
    expect(generatePageNumbers(5, 3)).toEqual([1, 2, 3, 4, 5]);
  });

  it("1ページの場合", () => {
    expect(generatePageNumbers(1, 1)).toEqual([1]);
  });

  it("先頭付近（currentPage=1）で省略記号は後ろのみ", () => {
    expect(generatePageNumbers(10, 1)).toEqual([1, 2, "ellipsis-end", 10]);
  });

  it("末尾付近（currentPage=10）で省略記号は前のみ", () => {
    expect(generatePageNumbers(10, 10)).toEqual([1, "ellipsis-start", 9, 10]);
  });

  it("中間（currentPage=5）で前後に省略記号", () => {
    expect(generatePageNumbers(10, 5)).toEqual([
      1,
      "ellipsis-start",
      4,
      5,
      6,
      "ellipsis-end",
      10,
    ]);
  });

  it("currentPage=3では前に省略記号なし", () => {
    expect(generatePageNumbers(10, 3)).toEqual([
      1,
      2,
      3,
      4,
      "ellipsis-end",
      10,
    ]);
  });

  it("currentPage=8では後ろに省略記号なし", () => {
    expect(generatePageNumbers(10, 8)).toEqual([
      1,
      "ellipsis-start",
      7,
      8,
      9,
      10,
    ]);
  });
});
