// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRubyToggle } from "./use-ruby-toggle";

describe("useRubyToggle", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, reload: vi.fn() },
      writable: true,
    });
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("初期状態: localStorage未設定時、rubyEnabledがfalse", () => {
    const { result } = renderHook(() => useRubyToggle());
    expect(result.current.rubyEnabled).toBe(false);
  });

  it("localStorage初期値反映: trueが設定されていたらuseEffect後にrubyEnabledがtrue", () => {
    localStorage.setItem("rubyful-enabled", "true");
    const { result } = renderHook(() => useRubyToggle());
    expect(result.current.rubyEnabled).toBe(true);
  });

  it("handleRubyToggle(true): rubyEnabledがtrueに変更されwindow.location.reloadが呼ばれる", () => {
    document.body.innerHTML = '<rt class="rubyful-rt">テスト</rt>';

    const { result } = renderHook(() => useRubyToggle());

    act(() => {
      result.current.handleRubyToggle(true);
    });

    expect(result.current.rubyEnabled).toBe(true);
    expect(window.location.reload).toHaveBeenCalled();

    document.body.innerHTML = "";
  });

  it("handleRubyToggle(false): rubyEnabledがfalseに変更されwindow.location.reloadが呼ばれる", () => {
    document.body.innerHTML = '<rt class="rubyful-rt">テスト</rt>';
    localStorage.setItem("rubyful-enabled", "true");

    const { result } = renderHook(() => useRubyToggle());

    act(() => {
      result.current.handleRubyToggle(false);
    });

    expect(result.current.rubyEnabled).toBe(false);
    expect(window.location.reload).toHaveBeenCalled();

    document.body.innerHTML = "";
  });

  it("toggle後のlocalStorage: handleRubyToggle(true)後にlocalStorageにtrueが保存される", () => {
    document.body.innerHTML = '<rt class="rubyful-rt">テスト</rt>';

    const { result } = renderHook(() => useRubyToggle());

    act(() => {
      result.current.handleRubyToggle(true);
    });

    expect(localStorage.getItem("rubyful-enabled")).toBe("true");

    document.body.innerHTML = "";
  });
});
