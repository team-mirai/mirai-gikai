"use client";

import { useEffect, useRef, useState } from "react";

/** 引用の行高(px)と最大行数。leading-[22px] × 4行 に対応。 */
const LINE_HEIGHT = 22;
const MAX_LINES = 4;

interface ClampedQuoteProps {
  quote: string;
  /** 肩書ラベル（例: 育休経験者）。括弧と下線は本コンポーネントで付与する。 */
  attribution: string;
}

/**
 * 引用文を「肩書を含めて最大4行」に収める。
 * 4行を超える場合は本文を切り詰めて末尾に「…（肩書）」をインライン表示する。
 * 表示幅に応じて収まる文字数を二分探索で求めるため、SP/PC どちらにも追従する。
 */
export function ClampedQuote({ quote, attribution }: ClampedQuoteProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const quoteRef = useRef<HTMLSpanElement>(null);
  const [visibleQuote, setVisibleQuote] = useState(quote);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const quoteEl = quoteRef.current;
    if (!container || !quoteEl) return;

    const maxHeight = LINE_HEIGHT * MAX_LINES + 1;
    // 計測中は textContent を直接書き換える（最後に state で確定描画する）。
    const fits = (text: string) => {
      quoteEl.textContent = text;
      return container.scrollHeight <= maxHeight;
    };

    const apply = () => {
      if (fits(quote)) {
        setVisibleQuote(quote);
        setTruncated(false);
        return;
      }
      // 「…」を付けて 4行に収まる最大文字数を二分探索する。
      let lo = 0;
      let hi = quote.length;
      let best = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (fits(`${quote.slice(0, mid)}…`)) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      setVisibleQuote(quote.slice(0, best));
      setTruncated(true);
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(container);
    return () => observer.disconnect();
  }, [quote]);

  return (
    <span
      ref={containerRef}
      className="block max-h-[88px] overflow-hidden font-mirai-serif text-[14px] font-semibold leading-[22px] text-mirai-text"
    >
      <span className="mr-1 align-[-0.1em] text-[18px] text-primary-accent">
        “
      </span>
      <span ref={quoteRef} className="hover:underline">
        {visibleQuote}
      </span>
      {truncated && "…"}
      <span className="ml-1 whitespace-nowrap text-[11px] text-primary-accent">
        （<span className="underline">{attribution}</span>）
      </span>
    </span>
  );
}
