import { describe, expect, it } from "vitest";
import { getCardStatusLabel, getStatusVariant } from "./bill-status";

describe("getCardStatusLabel", () => {
  it.each([
    ["introduced", "国会審議中"],
    ["in_originating_house", "国会審議中"],
    ["in_receiving_house", "国会審議中"],
  ] as const)("審議中ステータス %s → %s", (status, expected) => {
    expect(getCardStatusLabel(status)).toBe(expected);
  });

  it("enacted → 法案成立", () => {
    expect(getCardStatusLabel("enacted")).toBe("法案成立");
  });

  it("rejected → 否決", () => {
    expect(getCardStatusLabel("rejected")).toBe("否決");
  });

  it("preparing → 法案提出前", () => {
    expect(getCardStatusLabel("preparing")).toBe("法案提出前");
  });
});

describe("getStatusVariant", () => {
  it.each([
    ["introduced", "light"],
    ["in_originating_house", "light"],
    ["in_receiving_house", "light"],
  ] as const)("審議中ステータス %s → %s", (status, expected) => {
    expect(getStatusVariant(status)).toBe(expected);
  });

  it("enacted → default", () => {
    expect(getStatusVariant("enacted")).toBe("default");
  });

  it("rejected → dark", () => {
    expect(getStatusVariant("rejected")).toBe("dark");
  });

  it("preparing → muted", () => {
    expect(getStatusVariant("preparing")).toBe("muted");
  });
});
