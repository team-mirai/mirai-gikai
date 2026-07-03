// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useTooltipPosition } from "./use-tooltip-position";

describe("useTooltipPosition", () => {
  // テストで使い回す標準的なダミーの DOMRect
  const mockRect = {
    bottom: 100,
    left: 200,
    width: 50,
  } as DOMRect;

  beforeEach(() => {
    // 画面幅のデフォルトを 1024px にリセット
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("isVisible が false の場合は初期位置（top: 0, left: 0）を返すこと", () => {
    const { result } = renderHook(() =>
      useTooltipPosition({ rect: mockRect, isVisible: false })
    );

    expect(result.current).toEqual({
      position: "fixed",
      top: 0,
      left: 0,
    });
  });

  it("rect が null の場合は初期位置（top: 0, left: 0）を返すこと", () => {
    const { result } = renderHook(() =>
      useTooltipPosition({ rect: null, isVisible: true })
    );

    expect(result.current).toEqual({
      position: "fixed",
      top: 0,
      left: 0,
    });
  });

  it("正常系: 画面内に十分なスペースがあるとき、中央揃えの位置が正しく計算されること", () => {
    const { result } = renderHook(() =>
      useTooltipPosition({ rect: mockRect, isVisible: true })
    );

    // top: rect.bottom (100) + margin (8) = 108
    // left: rect.left (200) + (width (50) / 2) - (tooltipWidth (104) / 2) = 173
    expect(result.current).toEqual({
      position: "fixed",
      top: 108,
      left: 173,
    });
  });

  it("左端の境界値: 計算された left が画面左端を突き抜ける場合、最小マージン（8）に固定されること", () => {
    const leftEdgeRect = {
      bottom: 100,
      left: 10,
      width: 20,
    } as DOMRect;

    const { result } = renderHook(() =>
      useTooltipPosition({ rect: leftEdgeRect, isVisible: true })
    );

    // 理論値: 10 + 10 - 52 = -32 (マージン 8 より小さいため 8 にクランプされる)
    expect(result.current.left).toBe(8);
  });

  it("右端の境界値: 計算された left が画面右端を突き抜ける場合、画面内に収まる最大値に固定されること", () => {
    // テスト用に画面幅を 500px に設定
    window.innerWidth = 500;

    const rightEdgeRect = {
      bottom: 100,
      left: 460,
      width: 30,
    } as DOMRect;

    const { result } = renderHook(() =>
      useTooltipPosition({ rect: rightEdgeRect, isVisible: true })
    );

    // 理論値: 460 + 15 - 52 = 423
    // 許容最大値 (maxLeft): innerWidth (500) - tooltipWidth (104) - margin (8) = 388
    expect(result.current.left).toBe(388);
  });
});
