import { describe, expect, it } from "vitest";
import { buildContentRichnessInstructions } from "./content-richness-instructions";

describe("buildContentRichnessInstructions", () => {
  it("5つの評価観点がすべて含まれる", () => {
    const result = buildContentRichnessInstructions();

    expect(result).toContain("**total**");
    expect(result).toContain("**clarity**");
    expect(result).toContain("**specificity**");
    expect(result).toContain("**impact**");
    expect(result).toContain("**constructiveness**");
    expect(result).toContain("**reasoning**");
  });

  it("スコアリング基準が含まれる", () => {
    const result = buildContentRichnessInstructions();

    expect(result).toContain("80-100");
    expect(result).toContain("60-79");
    expect(result).toContain("40-59");
    expect(result).toContain("20-39");
    expect(result).toContain("0-19");
  });
});
