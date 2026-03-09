// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStateWithRef } from "./use-state-with-ref";

describe("useStateWithRef", () => {
  it("初期値がstateとrefの両方に設定される", () => {
    const { result } = renderHook(() => useStateWithRef(0));
    const [state, , ref] = result.current;
    expect(state).toBe(0);
    expect(ref.current).toBe(0);
  });

  it("値を設定するとstateとrefが同時に更新される", () => {
    const { result } = renderHook(() => useStateWithRef(0));

    act(() => {
      const [, set] = result.current;
      set(42);
    });

    const [state, , ref] = result.current;
    expect(state).toBe(42);
    expect(ref.current).toBe(42);
  });

  it("関数アップデーターを使うと前の値から計算される", () => {
    const { result } = renderHook(() => useStateWithRef(10));

    act(() => {
      const [, set] = result.current;
      set((prev) => prev + 5);
    });

    const [state, , ref] = result.current;
    expect(state).toBe(15);
    expect(ref.current).toBe(15);
  });

  it("setはメモ化されており参照が変わらない", () => {
    const { result, rerender } = renderHook(() => useStateWithRef(0));

    const [, setFirst] = result.current;
    rerender();
    const [, setSecond] = result.current;

    expect(setFirst).toBe(setSecond);
  });

  it("setを呼び出した後、refからすぐに最新値を参照できる", () => {
    const { result } = renderHook(() => useStateWithRef("initial"));

    let capturedFromRef = "";

    act(() => {
      const [, set, ref] = result.current;
      set("updated");
      capturedFromRef = ref.current;
    });

    expect(capturedFromRef).toBe("updated");
  });

  it("文字列型でも正しく動作する", () => {
    const { result } = renderHook(() => useStateWithRef("hello"));

    act(() => {
      const [, set] = result.current;
      set("world");
    });

    const [state, , ref] = result.current;
    expect(state).toBe("world");
    expect(ref.current).toBe("world");
  });

  it("オブジェクト型でも正しく動作する", () => {
    const initial = { name: "Alice" };
    const { result } = renderHook(() => useStateWithRef(initial));

    const updated = { name: "Bob" };
    act(() => {
      const [, set] = result.current;
      set(updated);
    });

    const [state, , ref] = result.current;
    expect(state).toEqual({ name: "Bob" });
    expect(ref.current).toEqual({ name: "Bob" });
  });
});
