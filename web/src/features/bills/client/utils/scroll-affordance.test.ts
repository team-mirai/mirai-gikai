import { describe, expect, it } from "vitest";
import {
  resolveScrollAffordance,
  resolveScrollStep,
} from "./scroll-affordance";

describe("resolveScrollAffordance", () => {
  it("中身が収まっていればどちらも出さない", () => {
    expect(
      resolveScrollAffordance({
        scrollLeft: 0,
        clientWidth: 800,
        scrollWidth: 800,
      })
    ).toEqual({ canScrollLeft: false, canScrollRight: false });
  });

  it("左端では右にだけ出す", () => {
    expect(
      resolveScrollAffordance({
        scrollLeft: 0,
        clientWidth: 400,
        scrollWidth: 900,
      })
    ).toEqual({ canScrollLeft: false, canScrollRight: true });
  });

  it("途中では両側に出す", () => {
    expect(
      resolveScrollAffordance({
        scrollLeft: 200,
        clientWidth: 400,
        scrollWidth: 900,
      })
    ).toEqual({ canScrollLeft: true, canScrollRight: true });
  });

  it("右端では左にだけ出す", () => {
    expect(
      resolveScrollAffordance({
        scrollLeft: 500,
        clientWidth: 400,
        scrollWidth: 900,
      })
    ).toEqual({ canScrollLeft: true, canScrollRight: false });
  });

  // scrollLeft は小数になる。端まで送っても scrollWidth との差が 0 にならず、
  // 余裕を持たせないと矢印が消えない。
  it("端まで送ったときの端数を端として扱う", () => {
    expect(
      resolveScrollAffordance({
        scrollLeft: 499.6,
        clientWidth: 400,
        scrollWidth: 900,
      }).canScrollRight
    ).toBe(false);

    expect(
      resolveScrollAffordance({
        scrollLeft: 0.4,
        clientWidth: 400,
        scrollWidth: 900,
      }).canScrollLeft
    ).toBe(false);
  });

  it("1px を超えて動いていれば左に出す", () => {
    expect(
      resolveScrollAffordance({
        scrollLeft: 1.5,
        clientWidth: 400,
        scrollWidth: 900,
      }).canScrollLeft
    ).toBe(true);
  });

  it("測定前の0でも落ちない", () => {
    expect(
      resolveScrollAffordance({
        scrollLeft: 0,
        clientWidth: 0,
        scrollWidth: 0,
      })
    ).toEqual({ canScrollLeft: false, canScrollRight: false });
  });
});

describe("resolveScrollStep", () => {
  it("見えている範囲の8割を送る", () => {
    expect(resolveScrollStep(300, 1)).toBe(240);
  });

  it("左送りは符号が反転する", () => {
    expect(resolveScrollStep(300, -1)).toBe(-240);
  });

  it("測定前の0では動かさない", () => {
    expect(resolveScrollStep(0, 1)).toBe(0);
  });
});
