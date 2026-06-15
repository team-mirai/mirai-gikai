import { describe, expect, it } from "vitest";
import { normalizeRichnessScore } from "./normalize-richness-score";

describe("normalizeRichnessScore", () => {
  it("範囲内の整数はそのまま返す", () => {
    expect(normalizeRichnessScore(0)).toBe(0);
    expect(normalizeRichnessScore(50)).toBe(50);
    expect(normalizeRichnessScore(100)).toBe(100);
  });

  it("小数は四捨五入する", () => {
    expect(normalizeRichnessScore(72.4)).toBe(72);
    expect(normalizeRichnessScore(72.5)).toBe(73);
  });

  it("範囲外はクランプする", () => {
    expect(normalizeRichnessScore(150)).toBe(100);
    expect(normalizeRichnessScore(-10)).toBe(0);
  });

  it("数値でない値は null を返す", () => {
    expect(normalizeRichnessScore(null)).toBeNull();
    expect(normalizeRichnessScore(undefined)).toBeNull();
    expect(normalizeRichnessScore(Number.NaN)).toBeNull();
    expect(normalizeRichnessScore(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
