// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  saveScrollDistanceFromBottom,
  useRestoreScrollFromBottom,
} from "./use-scroll-from-bottom";

const STORAGE_KEY = "scroll-distance-from-bottom";

describe("saveScrollDistanceFromBottom", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("画面下端からの距離をsessionStorageに保存する", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    saveScrollDistanceFromBottom();

    // distanceFromBottom = 2000 - 500 - 800 = 700
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("700");
  });

  it("スクロールが最下部の場合、距離0が保存される", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    saveScrollDistanceFromBottom();

    // distanceFromBottom = 1000 - 200 - 800 = 0
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("0");
  });
});

describe("useRestoreScrollFromBottom", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enabled=trueかつ保存値がある場合、スクロール位置を復元しストレージをクリアする", () => {
    sessionStorage.setItem(STORAGE_KEY, "300");
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    renderHook(() => useRestoreScrollFromBottom(true));

    // targetScrollTop = 2000 - 800 - 300 = 900
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 900,
      behavior: "instant",
    });
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("enabled=falseの場合、スクロール復元を行わない", () => {
    sessionStorage.setItem(STORAGE_KEY, "300");

    renderHook(() => useRestoreScrollFromBottom(false));

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("300");
  });

  it("保存値がない場合、スクロール復元を行わない", () => {
    renderHook(() => useRestoreScrollFromBottom(true));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("計算結果が負の場合、0にクランプされる", () => {
    sessionStorage.setItem(STORAGE_KEY, "5000");
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    renderHook(() => useRestoreScrollFromBottom(true));

    // targetScrollTop = 1000 - 800 - 5000 = -4800 → Math.max(0, -4800) = 0
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "instant",
    });
  });

  it("enabled切り替え時にスクロール復元が再実行される", () => {
    sessionStorage.setItem(STORAGE_KEY, "100");
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1500,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    const { rerender } = renderHook(
      ({ enabled }) => useRestoreScrollFromBottom(enabled),
      { initialProps: { enabled: false } }
    );

    expect(window.scrollTo).not.toHaveBeenCalled();

    // 値を再セット（前回enabledだったら消されるため）
    sessionStorage.setItem(STORAGE_KEY, "100");

    act(() => {
      rerender({ enabled: true });
    });

    // targetScrollTop = 1500 - 800 - 100 = 600
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 600,
      behavior: "instant",
    });
  });
});
