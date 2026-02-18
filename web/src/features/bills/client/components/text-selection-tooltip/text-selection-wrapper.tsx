"use client";

import { type PropsWithChildren, useRef } from "react";
import { TextSelectionPortal } from "./text-selection-tooltip-portal";

/**
 * テキスト選択機能のラッパーコンポーネント
 *
 * 実装背景:
 * - Server ComponentsでSSRされたコンテンツに対して、クライアントサイドでテキスト選択機能を追加
 * - React 13+ではServer ComponentからClient Componentにイベントハンドラーを渡せないため、
 *   Client Component内でイベントハンドラーを定義する必要がある
 * - コンテンツ部分（children）はServer Componentのまま保持し、SSRによる高速な初期レンダリングを維持
 * - テキスト選択のインタラクティブ機能のみをClient Componentで実装
 *
 * アーキテクチャ:
 * - Portalベースの設計により、テキスト選択の状態更新が既存のDOMに影響しない
 * - 選択されたテキストのtooltipは別のPortalでレンダリングされ、
 *   selectionchangeイベントでの状態更新時にコンテンツDOMの再レンダリングを防ぐ
 */

interface TextSelectionWrapperProps extends PropsWithChildren {
  onOpenChat?: (selectedText: string) => void;
}

export function TextSelectionWrapper({
  children,
  onOpenChat,
}: TextSelectionWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAskQuestion = (text: string) => {
    if (onOpenChat) {
      onOpenChat(text);
      // テキスト選択を解除
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <>
      <div ref={containerRef}>{children}</div>
      <TextSelectionPortal
        containerRef={containerRef}
        onAskQuestion={handleAskQuestion}
      />
    </>
  );
}
