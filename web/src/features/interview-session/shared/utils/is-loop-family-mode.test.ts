import { describe, expect, it } from "vitest";
import { isLoopFamilyMode } from "./is-loop-family-mode";

describe("isLoopFamilyMode", () => {
  it("loop は true", () => {
    expect(isLoopFamilyMode("loop")).toBe(true);
  });

  it("targeted は true", () => {
    expect(isLoopFamilyMode("targeted")).toBe(true);
  });

  it("bulk は false", () => {
    expect(isLoopFamilyMode("bulk")).toBe(false);
  });

  it("undefined は false", () => {
    expect(isLoopFamilyMode(undefined)).toBe(false);
  });

  it("null は false", () => {
    expect(isLoopFamilyMode(null)).toBe(false);
  });
});
