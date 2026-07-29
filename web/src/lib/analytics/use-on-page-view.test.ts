// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnPageView } from "./use-on-page-view";

const usePathnameMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));

beforeEach(() => {
  usePathnameMock.mockReturnValue("/bills/1");
});

describe("useOnPageView", () => {
  it("マウント時にeffectを実行する", () => {
    const effect = vi.fn();
    renderHook(() => useOnPageView(effect));
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("pathnameが変わると再度effectを実行する", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useOnPageView(effect));
    expect(effect).toHaveBeenCalledTimes(1);

    usePathnameMock.mockReturnValue("/bills/2");
    rerender();
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("pathnameが変わらなければeffectを再実行しない", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useOnPageView(effect));
    expect(effect).toHaveBeenCalledTimes(1);

    rerender();
    expect(effect).toHaveBeenCalledTimes(1);
  });
});
