// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsDesktop } from "./use-is-desktop";

type MockMediaQueryList = {
  matches: boolean;
  media: string;
  onchange: null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  trigger: (newMatches: boolean) => void;
};

const createMockMediaQueryList = (
  initialMatches: boolean
): MockMediaQueryList => {
  const handlers = new Set<(e: MediaQueryListEvent) => void>();
  const mql: MockMediaQueryList = {
    matches: initialMatches,
    media: "(min-width: 768px)",
    onchange: null,
    addEventListener: vi.fn(
      (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        handlers.add(handler);
      }
    ),
    removeEventListener: vi.fn(
      (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        handlers.delete(handler);
      }
    ),
    dispatchEvent: vi.fn(),
    trigger: (newMatches: boolean) => {
      mql.matches = newMatches;
      handlers.forEach((h) => {
        h({ matches: newMatches } as MediaQueryListEvent);
      });
    },
  };
  return mql;
};

describe("useIsDesktop", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  it("画面幅が768px未満（matchMediaがfalseを返す）場合、falseを返す", () => {
    const mockMql = createMockMediaQueryList(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });

  it("maxTouchPoints > 0 の場合、hasNoTouchがfalseになりfalseを返す", () => {
    const mockMql = createMockMediaQueryList(true);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      writable: true,
      configurable: true,
      value: 5,
    });

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });

  it("matchMediaのchangeイベントリスナーが登録される", () => {
    const mockMql = createMockMediaQueryList(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });

    renderHook(() => useIsDesktop());

    expect(mockMql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("アンマウント時にchangeイベントリスナーが解除される", () => {
    const mockMql = createMockMediaQueryList(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });

    const { unmount } = renderHook(() => useIsDesktop());
    unmount();

    expect(mockMql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("changeイベント発火時にcheckIsDesktopが再実行される（matchMediaが再度呼ばれる）", () => {
    const mockMql = createMockMediaQueryList(false);
    const matchMediaFn = vi.fn().mockReturnValue(mockMql);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: matchMediaFn,
    });

    renderHook(() => useIsDesktop());

    const callsBefore = matchMediaFn.mock.calls.length;

    act(() => {
      mockMql.trigger(true);
    });

    // changeイベント発火後、checkIsDesktopが再実行されmatchMediaが追加で呼ばれることを確認
    expect(matchMediaFn.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
