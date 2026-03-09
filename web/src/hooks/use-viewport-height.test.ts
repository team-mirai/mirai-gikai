// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useViewportHeight } from "./use-viewport-height";

describe("useViewportHeight", () => {
  const originalVisualViewport = window.visualViewport;

  afterEach(() => {
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: originalVisualViewport,
    });
  });

  it("visualViewportが存在する場合、初期の高さを返す", () => {
    const mockViewport = {
      height: 768,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: mockViewport,
    });

    const { result } = renderHook(() => useViewportHeight());
    expect(result.current).toBe(768);
  });

  it("visualViewportが存在しない場合、nullを返す", () => {
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: null,
    });

    const { result } = renderHook(() => useViewportHeight());
    expect(result.current).toBeNull();
  });

  it("resizeイベント時に高さが更新される", () => {
    let resizeHandler: (() => void) | undefined;
    const mockViewport = {
      height: 768,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "resize") {
          resizeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: mockViewport,
    });

    const { result } = renderHook(() => useViewportHeight());
    expect(result.current).toBe(768);

    act(() => {
      mockViewport.height = 500;
      resizeHandler?.();
    });

    expect(result.current).toBe(500);
  });

  it("scrollイベント時に高さが更新される", () => {
    let scrollHandler: (() => void) | undefined;
    const mockViewport = {
      height: 768,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "scroll") {
          scrollHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: mockViewport,
    });

    const { result } = renderHook(() => useViewportHeight());
    expect(result.current).toBe(768);

    act(() => {
      mockViewport.height = 600;
      scrollHandler?.();
    });

    expect(result.current).toBe(600);
  });

  it("アンマウント時にイベントリスナーが解除される", () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: {
        height: 768,
        addEventListener: vi.fn(),
        removeEventListener,
      },
    });

    const { unmount } = renderHook(() => useViewportHeight());
    unmount();

    expect(removeEventListener).toHaveBeenCalledTimes(2); // resize と scroll
  });
});
