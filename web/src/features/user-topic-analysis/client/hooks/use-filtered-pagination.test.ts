// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TopicFilter } from "../../shared/utils/filter-topics";
import { useFilteredPagination } from "./use-filtered-pagination";

type Item = { id: string; category: TopicFilter };

// industry / expert が 25 件ずつ。初期 10 件・1 回 10 件ずつ表示する。
const items: Item[] = Array.from({ length: 50 }, (_, i) => ({
  id: `item-${i}`,
  category: i % 2 === 0 ? "industry" : "expert",
}));

const filterItems = (list: Item[], filter: TopicFilter) =>
  filter === "all" ? list : list.filter((item) => item.category === filter);

const PERSIST_KEY = "test-list:bill-1";

function renderPagination(persistKey?: string) {
  return renderHook(() =>
    useFilteredPagination(items, filterItems, 10, 10, persistKey)
  );
}

describe("useFilteredPagination", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("persistKey 指定時、再マウントで保存した表示件数とフィルタを復元する", () => {
    const first = renderPagination(PERSIST_KEY);
    act(() => first.result.current.selectFilter("industry"));
    act(() => first.result.current.loadMore());
    first.unmount();

    const { result } = renderPagination(PERSIST_KEY);

    expect(result.current.filter).toBe("industry");
    expect(result.current.visible).toHaveLength(20);
    expect(result.current.remaining).toBe(5);
  });

  it("persistKey が異なる一覧の保存値は復元しない", () => {
    const first = renderPagination(PERSIST_KEY);
    act(() => first.result.current.selectFilter("industry"));
    first.unmount();

    const { result } = renderPagination("test-list:bill-2");

    expect(result.current.filter).toBe("all");
    expect(result.current.visible).toHaveLength(10);
  });

  it("persistKey が無いときは保存も復元もしない", () => {
    const first = renderPagination();
    act(() => first.result.current.selectFilter("industry"));
    act(() => first.result.current.loadMore());
    first.unmount();

    const { result } = renderPagination();

    expect(sessionStorage.length).toBe(0);
    expect(result.current.filter).toBe("all");
    expect(result.current.visible).toHaveLength(10);
  });
});

describe("useFilteredPagination（sessionStorage を使えない環境）", () => {
  const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");

  beforeEach(() => {
    // サイトデータの保存を禁止したブラウザでは、sessionStorage へのアクセス自体が
    // SecurityError を送出する。
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("Access is denied", "SecurityError");
      },
    });
  });

  afterEach(() => {
    if (original) Object.defineProperty(window, "sessionStorage", original);
  });

  it("例外を出さずに初期状態で表示し、フィルタともっと見るはメモリ上で動く", () => {
    const { result } = renderPagination(PERSIST_KEY);

    expect(result.current.filter).toBe("all");
    expect(result.current.visible).toHaveLength(10);

    act(() => result.current.selectFilter("industry"));
    act(() => result.current.loadMore());

    expect(result.current.filter).toBe("industry");
    expect(result.current.visible).toHaveLength(20);
  });
});
