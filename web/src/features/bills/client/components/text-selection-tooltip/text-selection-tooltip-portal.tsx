"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTextSelection } from "../../hooks/use-text-selection";
import { TextSelectionTooltip } from "./text-selection-tooltip";

/**
 * テキスト選択tooltipのPortalコンポーネント
 *
 * 実装背景:
 * - React Portalを使用して、tooltipをdocument.bodyに直接レンダリング
 * - これにより、テキスト選択の状態更新時にコンテンツエリアのDOMが再レンダリングされても
 *   選択状態が失われることを防ぐ
 * - Portalは既存のコンポーネントツリーから独立してレンダリングされるため、
 *   selectionchangeイベントでの頻繁な状態更新がコンテンツに影響しない
 *
 * 技術的詳細:
 * - mountedステートでSSR時の不整合を防ぐ
 * - useTextSelectionフックでテキスト選択の監視とrect計算を行う
 * - tooltip位置はviewport相対座標で計算し、スクロール時の位置ズレを防ぐ
 */

interface TextSelectionPortalProps {
  containerRef: RefObject<HTMLElement | null>;
  onAskQuestion: (text: string) => void;
}

export function TextSelectionPortal({
  containerRef,
  onAskQuestion,
}: TextSelectionPortalProps) {
  const [mounted, setMounted] = useState(false);
  const { selection, hasSelection } = useTextSelection({
    containerRef,
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <TextSelectionTooltip
      isVisible={hasSelection}
      selectedText={selection.text}
      rect={selection.rect}
      onAskQuestion={onAskQuestion}
    />,
    document.body
  );
}
