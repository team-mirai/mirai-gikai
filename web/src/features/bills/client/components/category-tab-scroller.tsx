"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { resolveScrollAffordance } from "../utils/scroll-affordance";

/** 1回の送り幅。見えている範囲を基準にすると、幅が変わっても送りすぎない。 */
const SCROLL_RATIO = 0.8;

/**
 * カテゴリタブの横スクロール。
 *
 * 矢印はスクロールできる向きにだけ出す。常に出すと、端まで見えているのに
 * まだ続きがあるように見える。スクロール操作と矢印のどちらでも動かせる。
 *
 * 矢印を出すのは広い画面だけ。狭い画面ではタブが2行になり、矢印を縦中央に
 * 置くと行の境目に重なって下の行のタブを覆う。
 */
export function CategoryTabScroller({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sync = useCallback(() => {
    const el = viewport.current;
    if (!el) return;

    const affordance = resolveScrollAffordance(el);
    setCanScrollLeft(affordance.canScrollLeft);
    setCanScrollRight(affordance.canScrollRight);
  }, []);

  useEffect(() => {
    const el = viewport.current;
    const inner = content.current;
    if (!el || !inner) return;

    sync();

    // 画面幅とタブの並び幅の両方で判定が変わる。フォントの読み込みや
    // タブの件数の変化で中身の幅だけが動くこともあるので、両方を見る。
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [sync]);

  const scrollTo = (direction: 1 | -1) => {
    const el = viewport.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    el.scrollBy({
      left: direction * el.clientWidth * SCROLL_RATIO,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={viewport}
        onScroll={sync}
        className="scrollbar-hide overflow-x-auto"
      >
        <div ref={content} className="w-max">
          {children}
        </div>
      </div>

      {/*
        送れない向きでも要素は残して disabled にする。押し切った瞬間にボタンが
        DOM から消えると、キーボード操作のフォーカスが body に落ちて位置を失う。
      */}
      <ScrollEdge
        side="left"
        disabled={!canScrollLeft}
        onClick={() => scrollTo(-1)}
      />
      <ScrollEdge
        side="right"
        disabled={!canScrollRight}
        onClick={() => scrollTo(1)}
      />
    </div>
  );
}

/**
 * 端に重ねる矢印。背景と同じ色へ向かうグラデーションを敷いて、タブが
 * 矢印の下で切れて見えるようにする。
 */
function ScrollEdge({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const isLeft = side === "left";

  return (
    <div
      className={`pointer-events-none absolute inset-y-0 hidden w-24 items-center sm:flex ${
        isLeft
          ? "left-0 justify-start bg-gradient-to-l from-transparent to-mirai-surface"
          : "right-0 justify-end bg-gradient-to-r from-transparent to-mirai-surface"
      } ${disabled ? "opacity-0" : ""}`}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        aria-label={isLeft ? "カテゴリを左に送る" : "カテゴリを右に送る"}
        className="pointer-events-auto"
      >
        {isLeft ? (
          <ChevronLeft className="text-primary-accent" strokeWidth={2.5} />
        ) : (
          <ChevronRight className="text-primary-accent" strokeWidth={2.5} />
        )}
      </Button>
    </div>
  );
}
