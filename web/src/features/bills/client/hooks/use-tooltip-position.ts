import { type CSSProperties, useEffect, useState } from "react";

interface UseTooltipPositionProps {
  rect: DOMRect | null;
  isVisible: boolean;
}

// 定数を定義
const TOOLTIP_DIMENSIONS = {
  height: 40,
  width: 104,
  margin: 8,
} as const;

/**
 * Tooltipの位置を計算するカスタムフック
 * 選択範囲の直下に表示する
 */
export function useTooltipPosition({
  rect,
  isVisible,
}: UseTooltipPositionProps): CSSProperties {
  const [position, setPosition] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!rect || !isVisible) return;

    const { width, margin } = TOOLTIP_DIMENSIONS;

    const top = rect.bottom + margin;

    let left = rect.left + rect.width / 2 - width / 2;

    const maxLeft = window.innerWidth - width - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    setPosition({
      position: "fixed",
      top,
      left,
    });
  }, [rect, isVisible]);

  return position;
}
