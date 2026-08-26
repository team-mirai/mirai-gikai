// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveScrollStep } from "../utils/scroll-affordance";
import { CategoryTabScroller } from "./category-tab-scroller";

/*
  矢印を出すかどうかの判定そのものは resolveScrollAffordance のテストで見ている。
  ここで見るのはコンポーネント側の配線、つまり「どの契機で再判定が走るか」
  「どれだけ送るか」「監視を張って外すか」。

  jsdom は要素の寸法を持たず clientWidth も scrollWidth も常に 0 を返すので、
  判定に使う3つの値を差し替えて動かす。
*/
type Metrics = { scrollLeft: number; clientWidth: number; scrollWidth: number };

/** 中身が右にはみ出していて、右にだけ送れる状態。 */
const OVERFLOWING: Metrics = {
  scrollLeft: 0,
  clientWidth: 300,
  scrollWidth: 1000,
};

let resizeCallbacks: ResizeObserverCallback[];
let observed: Element[];
let disconnectCount: number;
let scrollBySpy: ReturnType<typeof vi.fn>;
let reduceMotion: boolean;

beforeEach(() => {
  resizeCallbacks = [];
  observed = [];
  disconnectCount = 0;
  reduceMotion = false;

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe(target: Element) {
        observed.push(target);
      }
      unobserve() {}
      disconnect() {
        disconnectCount += 1;
      }
    }
  );

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion") && reduceMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );

  // jsdom は scrollBy を持たないので spyOn できない。生やして afterEach で消す。
  scrollBySpy = vi.fn();
  Element.prototype.scrollBy = scrollBySpy;
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, "scrollBy");
});

function setup() {
  const view = render(
    <CategoryTabScroller>
      <div data-testid="tabs">タブ</div>
    </CategoryTabScroller>
  );

  // タブ → 中身のラッパー → スクロールする枠。class ではなく構造で辿る。
  const content = screen.getByTestId("tabs").parentElement;
  const viewport = content?.parentElement;
  if (!content || !viewport) {
    throw new Error("スクローラーの構造が変わっている");
  }

  const apply = (metrics: Metrics) => {
    for (const [key, value] of Object.entries(metrics)) {
      Object.defineProperty(viewport, key, { value, configurable: true });
    }
  };

  /** 幅が変わったときの経路。 */
  const resize = (metrics: Metrics) => {
    apply(metrics);
    act(() => {
      for (const callback of resizeCallbacks) {
        callback([], {} as ResizeObserver);
      }
    });
  };

  /** スクロール操作の経路。 */
  const scroll = (metrics: Metrics) => {
    apply(metrics);
    fireEvent.scroll(viewport);
  };

  return {
    left: screen.getByRole("button", { name: "カテゴリを左に送る" }),
    right: screen.getByRole("button", { name: "カテゴリを右に送る" }),
    content,
    viewport,
    resize,
    scroll,
    unmount: view.unmount,
  };
}

describe("CategoryTabScroller", () => {
  it("中身が収まっているうちはどちらにも送れない", () => {
    const { left, right } = setup();

    expect(left).toBeDisabled();
    expect(right).toBeDisabled();
  });

  /*
    画面幅とタブの並び幅のどちらでも判定が変わる。フォントの読み込みやタブの
    件数の変化で中身の幅だけが動くこともあるので、両方を監視する。
  */
  it("枠と中身の両方の寸法を監視する", () => {
    const { content, viewport } = setup();

    expect(observed).toContain(viewport);
    expect(observed).toContain(content);
  });

  it("外したときに監視をやめる", () => {
    const { unmount } = setup();

    expect(disconnectCount).toBe(0);
    unmount();
    expect(disconnectCount).toBe(1);
  });

  it("幅が変わると矢印を出し直す", () => {
    const { right, resize } = setup();

    expect(right).toBeDisabled();
    resize(OVERFLOWING);
    expect(right).toBeEnabled();
  });

  it("スクロールすると矢印を出し直す", () => {
    const { left, right, scroll } = setup();

    scroll({ scrollLeft: 700, clientWidth: 300, scrollWidth: 1000 });

    expect(left).toBeEnabled();
    expect(right).toBeDisabled();
  });

  it("見えている範囲を基準に送り、向きで符号が変わる", async () => {
    const user = userEvent.setup();
    const { left, right, scroll } = setup();

    scroll({ scrollLeft: 350, clientWidth: 300, scrollWidth: 1000 });

    await user.click(right);
    expect(scrollBySpy).toHaveBeenLastCalledWith({
      left: resolveScrollStep(300, 1),
      behavior: "smooth",
    });

    await user.click(left);
    expect(scrollBySpy).toHaveBeenLastCalledWith({
      left: resolveScrollStep(300, -1),
      behavior: "smooth",
    });
  });

  it("動きを減らす設定ではアニメーションなしで送る", async () => {
    reduceMotion = true;
    const user = userEvent.setup();
    const { right, resize } = setup();

    resize(OVERFLOWING);
    await user.click(right);

    expect(scrollBySpy).toHaveBeenLastCalledWith({
      left: resolveScrollStep(300, 1),
      behavior: "auto",
    });
  });

  // 押し切った瞬間にボタンが消えると、キーボードのフォーカスが body に落ちる。
  it("送れない向きの矢印も DOM から消さない", () => {
    const { left, right, resize } = setup();

    resize(OVERFLOWING);

    expect(left).toBeDisabled();
    expect(left).toBeInTheDocument();
    expect(right).toBeInTheDocument();
  });
});
