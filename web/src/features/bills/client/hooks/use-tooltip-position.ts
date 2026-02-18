import { useEffect, useState } from "react";

interface UseTooltipPositionProps {
  rect: DOMRect | null;
  isVisible: boolean;
}

interface Position {
  top: number;
  left: number;
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
}: UseTooltipPositionProps): Position {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  useEffect(() => {
    if (!rect || !isVisible) return;

    const dimensions = TOOLTIP_DIMENSIONS;
    const { width, margin } = dimensions;

    // 選択範囲の直下に配置
    const top = rect.bottom + margin;

    // 中央揃えで配置
    let left = rect.left + rect.width / 2 - width / 2;

    // 画面端からはみ出さないよう調整
    const maxLeft = window.innerWidth - width - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    setPosition({ top, left });
  }, [rect, isVisible]);

  return position;
}
