import { describe, expect, it } from "vitest";
import { getCardStatusLabel, getStatusVariant } from "./bill-status";

describe("getCardStatusLabel", () => {
  it.each([
    ["introduced", "審議中"],
    ["in_originating_house", "審議中"],
    ["in_receiving_house", "審議中"],
  ] as const)("審議中ステータス %s → %s", (status, expected) => {
    expect(getCardStatusLabel(status)).toBe(expected);
  });

  it("enacted → 可決", () => {
    expect(getCardStatusLabel("enacted")).toBe("可決");
  });

  it("rejected → 否決", () => {
    expect(getCardStatusLabel("rejected")).toBe("否決");
  });

  it("preparing → 議案提出前", () => {
    expect(getCardStatusLabel("preparing")).toBe("議案提出前");
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
