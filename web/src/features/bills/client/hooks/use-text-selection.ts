"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

/**
 * テキスト選択を監視するカスタムフック
 *
 * 実装背景:
 * - selectionchangeイベントを使用してテキスト選択を監視
 * - 選択範囲の位置情報（DOMRect）を取得し、tooltip表示位置の計算に使用
 * - コンテナ要素を指定することで、特定の範囲内での選択のみを対象にできる
 *
 * 技術的な課題と解決策:
 * - selectionchangeイベントでの状態更新がDOM再レンダリングを引き起こし、選択が解除される問題
 *   → Portal architecture により状態更新の影響範囲を局所化
 * - スクロール時のtooltip位置ずれ問題
 *   → getBoundingClientRect()でviewport相対の位置を取得
 * - range.cloneRange()により、元のRangeオブジェクトの変更から保護
 */

interface TextSelection {
  text: string;
  range: Range | null;
  rect: DOMRect | null;
}

interface UseTextSelectionOptions {
  containerRef?: RefObject<HTMLElement | null>;
  minLength?: number;
}

/**
 * 選択範囲からルビ（<rt>要素）のテキストを除外する
 */
function getTextWithoutRuby(range: Range): string {
  const fragment = range.cloneContents();
  const tempDiv = document.createElement("div");
  tempDiv.appendChild(fragment);

  // すべての<rt>要素を削除
  const rtElements = tempDiv.querySelectorAll("rt");
  rtElements.forEach((rt) => {
    rt.remove();
  });

  return tempDiv.textContent?.trim() ?? "";
}

export function useTextSelection({
  containerRef,
  minLength = 1,
}: UseTextSelectionOptions = {}) {
  const [selection, setSelection] = useState<TextSelection>({
    text: "",
    range: null,
    rect: null,
  });

  const handleSelectionChange = useCallback(() => {
    const windowSelection = window.getSelection();

    if (!windowSelection || windowSelection.rangeCount === 0) {
      setSelection({ text: "", range: null, rect: null });
      return;
    }

    const range = windowSelection.getRangeAt(0);
    const selectedText = getTextWithoutRuby(range);

    // 最小文字数チェック
    if (selectedText.length < minLength) {
      setSelection({ text: "", range: null, rect: null });
      return;
    }

    // コンテナ内での選択かチェック
    if (containerRef?.current) {
      const container = containerRef.current;
      if (!container.contains(range.commonAncestorContainer)) {
        setSelection({ text: "", range: null, rect: null });
        return;
      }
    }

    // 選択範囲の位置を取得
    const rect = range.getBoundingClientRect();

    setSelection({
      text: selectedText,
      range: range.cloneRange(),
      rect,
    });
  }, [containerRef, minLength]);

  const clearSelection = useCallback(() => {
    setSelection({ text: "", range: null, rect: null });
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return {
    selection,
    clearSelection,
    hasSelection: selection.text.length > 0,
  };
}
