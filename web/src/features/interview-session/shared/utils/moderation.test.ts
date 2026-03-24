import { describe, expect, it } from "vitest";
import { determineModerationStatus } from "./moderation";

describe("determineModerationStatus", () => {
  it.each([
    { score: 0, expected: "ok" },
    { score: 15, expected: "ok" },
    { score: 29, expected: "ok" },
  ])("score $score → $expected (ok範囲: 0-29)", ({ score, expected }) => {
    expect(determineModerationStatus(score)).toBe(expected);
  });

  it.each([
    { score: 30, expected: "warning" },
    { score: 50, expected: "warning" },
    { score: 69, expected: "warning" },
  ])("score $score → $expected (warning範囲: 30-69)", ({ score, expected }) => {
    expect(determineModerationStatus(score)).toBe(expected);
  });

  it.each([
    { score: 70, expected: "ng" },
    { score: 85, expected: "ng" },
    { score: 100, expected: "ng" },
  ])("score $score → $expected (ng範囲: 70-100)", ({ score, expected }) => {
    expect(determineModerationStatus(score)).toBe(expected);
  });
});
