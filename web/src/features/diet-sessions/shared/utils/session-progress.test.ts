import { describe, expect, it } from "vitest";
import { calculateSessionProgress } from "./session-progress";

const session = { start_date: "2026-02-18", end_date: "2026-07-17" };
/**
 * 呼び出し側は getJapanTime() で「日本時刻の壁時計を持つ Date」を渡すので、
 * テストも壁時計（ローカル解釈）で組む。UTC 指定にすると JST では別日になる。
 */
const at = (wallClock: string) => new Date(wallClock);

describe("calculateSessionProgress", () => {
  it("召集日は0%で、残り日数は会期の全日数になる", () => {
    const result = calculateSessionProgress(session, at("2026-02-18 09:00"));

    expect(result.percentage).toBe(0);
    expect(result.daysLeft).toBe(149);
  });

  it("閉会予定日は100%で残り0日", () => {
    const result = calculateSessionProgress(session, at("2026-07-17 09:00"));

    expect(result).toEqual({ percentage: 100, daysLeft: 0 });
  });

  it("中間地点はおよそ50%になる", () => {
    // 2026-02-18 から 2026-07-17 の中日は 2026-05-03。
    const result = calculateSessionProgress(session, at("2026-05-03 09:00"));

    expect(result.percentage).toBeGreaterThanOrEqual(49);
    expect(result.percentage).toBeLessThanOrEqual(51);
  });

  // 会期が延長されず閉会日を過ぎた場合でも、バーが100%を超えない。
  it("閉会予定日を過ぎても100%と残り0日で止まる", () => {
    const result = calculateSessionProgress(session, at("2026-08-01 09:00"));

    expect(result).toEqual({ percentage: 100, daysLeft: 0 });
  });

  it("召集前は0%で、残り日数は閉会日まで数える", () => {
    const result = calculateSessionProgress(session, at("2026-01-01 09:00"));

    expect(result.percentage).toBe(0);
    expect(result.daysLeft).toBe(197);
  });

  // 実行時刻で残り日数が揺れると、同じ日に見た人で表示が変わる。
  it("同じ日なら時刻によらず同じ結果になる", () => {
    const morning = calculateSessionProgress(session, at("2026-05-03 00:30"));
    const night = calculateSessionProgress(session, at("2026-05-03 23:30"));

    expect(morning).toEqual(night);
  });

  // NaN が width や aria-valuenow に流れると DOM が壊れる。
  it("日付の形が違えば0%・残り0日に倒す", () => {
    const malformed = {
      start_date: "2026-02-18T00:00:00+09:00",
      end_date: "2026-07-17",
    };

    expect(calculateSessionProgress(malformed, at("2026-05-03 09:00"))).toEqual(
      {
        percentage: 0,
        daysLeft: 0,
      }
    );
  });

  it("召集日と閉会日が同じ会期でも0除算しない", () => {
    const sameDay = { start_date: "2026-05-01", end_date: "2026-05-01" };

    expect(calculateSessionProgress(sameDay, at("2026-05-01 09:00"))).toEqual({
      percentage: 100,
      daysLeft: 0,
    });
    expect(calculateSessionProgress(sameDay, at("2026-04-30 09:00"))).toEqual({
      percentage: 0,
      daysLeft: 0,
    });
  });
});
