import { describe, expect, it } from "vitest";
import { calcRemainingMinutes } from "./calc-remaining-minutes";

describe("calcRemainingMinutes", () => {
  const baseTime = new Date("2026-02-23T10:00:00Z");

  it("estimatedDurationがnullの場合はnullを返す", () => {
    expect(
      calcRemainingMinutes(null, "2026-02-23T09:50:00Z", baseTime)
    ).toBeNull();
  });

  it("estimatedDurationがundefinedの場合はnullを返す", () => {
    expect(
      calcRemainingMinutes(undefined, "2026-02-23T09:50:00Z", baseTime)
    ).toBeNull();
  });

  it("残り時間を正しく計算する（10分のうち5分経過→残り5分）", () => {
    const started = "2026-02-23T09:55:00Z";
    expect(calcRemainingMinutes(10, started, baseTime)).toBe(5);
  });

  it("残り時間を切り上げで返す（10分のうち3.5分経過→残り7分）", () => {
    // 3分30秒経過
    const started = "2026-02-23T09:56:30Z";
    expect(calcRemainingMinutes(10, started, baseTime)).toBe(7);
  });

  it("開始直後は目安時間と同じ値を返す", () => {
    expect(calcRemainingMinutes(15, "2026-02-23T10:00:00Z", baseTime)).toBe(15);
  });

  it("時間超過の場合は0を返す", () => {
    const started = "2026-02-23T09:30:00Z"; // 30分前
    expect(calcRemainingMinutes(10, started, baseTime)).toBe(0);
  });

  it("ちょうど時間ぴったりの場合は0を返す", () => {
    const started = "2026-02-23T09:50:00Z"; // 10分前
    expect(calcRemainingMinutes(10, started, baseTime)).toBe(0);
  });
});
