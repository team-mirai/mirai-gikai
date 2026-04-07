import { describe, expect, it } from "vitest";
import { parseSortOrder } from "./sort-order";

describe("parseSortOrder", () => {
  it("有効な値をそのまま返す", () => {
    expect(parseSortOrder("recommended")).toBe("recommended");
    expect(parseSortOrder("newest")).toBe("newest");
  });

  it("無効な値の場合は 'recommended' を返す", () => {
    expect(parseSortOrder("invalid")).toBe("recommended");
    expect(parseSortOrder("")).toBe("recommended");
  });

  it("null の場合は 'recommended' を返す", () => {
    expect(parseSortOrder(null)).toBe("recommended");
  });
});
