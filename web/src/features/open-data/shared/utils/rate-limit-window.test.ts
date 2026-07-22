import { describe, expect, it } from "vitest";
import { getRetryAfterSeconds, getWindowStart } from "./rate-limit-window";

describe("getWindowStart", () => {
  it("60秒ウィンドウでは分頭に丸める", () => {
    const now = new Date("2026-07-14T12:34:56.789Z");
    expect(getWindowStart(now, 60).toISOString()).toBe(
      "2026-07-14T12:34:00.000Z"
    );
  });

  it("ウィンドウ境界ちょうどの時刻はそのまま返す", () => {
    const now = new Date("2026-07-14T12:34:00.000Z");
    expect(getWindowStart(now, 60).toISOString()).toBe(
      "2026-07-14T12:34:00.000Z"
    );
  });

  it("同一ウィンドウ内の時刻は同じ開始時刻になる", () => {
    const a = getWindowStart(new Date("2026-07-14T12:34:01.000Z"), 60);
    const b = getWindowStart(new Date("2026-07-14T12:34:59.999Z"), 60);
    expect(a.getTime()).toBe(b.getTime());
  });
});

describe("getRetryAfterSeconds", () => {
  it("ウィンドウ終了までの残り秒数を切り上げで返す", () => {
    const now = new Date("2026-07-14T12:34:56.500Z");
    expect(getRetryAfterSeconds(now, 60)).toBe(4);
  });

  it("最小でも1秒を返す", () => {
    const now = new Date("2026-07-14T12:34:59.999Z");
    expect(getRetryAfterSeconds(now, 60)).toBe(1);
  });
});
