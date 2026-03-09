// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./use-media-query";

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
    media: "",
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

describe("useMediaQuery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("初期状態: メディアクエリにマッチしない場合、falseを返す", () => {
    const mockMql = createMockMediaQueryList(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("初期状態: メディアクエリにマッチする場合、trueを返す", () => {
    const mockMql = createMockMediaQueryList(true);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("メディアクエリが変化した場合、状態が更新される", () => {
    const mockMql = createMockMediaQueryList(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      mockMql.trigger(true);
    });

    expect(result.current).toBe(true);
  });

  it("アンマウント時にイベントリスナーが解除される", () => {
    const mockMql = createMockMediaQueryList(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();

    expect(mockMql.removeEventListener).toHaveBeenCalled();
  });

  it("クエリが変わった場合、新しいクエリに対してリスナーが設定される", () => {
    const mockMql1 = createMockMediaQueryList(false);
    const mockMql2 = createMockMediaQueryList(true);
    let callCount = 0;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockMql1 : mockMql2;
      }),
    });

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useMediaQuery(query),
      { initialProps: { query: "(min-width: 768px)" } }
    );

    expect(result.current).toBe(false);

    rerender({ query: "(min-width: 1024px)" });

    expect(result.current).toBe(true);
    expect(mockMql1.removeEventListener).toHaveBeenCalled();
  });
});
