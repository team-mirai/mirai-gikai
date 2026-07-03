// @vitest-environment jsdom
import "@testing-library/jest-dom";
import type { UIMessage } from "@ai-sdk/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserMessage } from "./user-message"; // ← 実際のパスに合わせて調整してください

describe("UserMessage", () => {
  it("複数のテキストパーツが含まれている場合、すべて正しくレンダリングされること", () => {
    // as unknown as UIMessage でキャストすることで型エラーを回避
    const mockMessage = {
      id: "test-message-1",
      role: "user",
      parts: [
        { type: "text", text: "こんにちは、" },
        { type: "text", text: "テストメッセージです。" },
      ],
    } as unknown as UIMessage;

    render(<UserMessage message={mockMessage} />);

    expect(screen.getByText("こんにちは、")).toBeInTheDocument();
    expect(screen.getByText("テストメッセージです。")).toBeInTheDocument();
  });

  it("明細パーツに text 以外のタイプが含まれている場合、それはスキップして表示しないこと", () => {
    // 不必要な content や、型エラーの原因になる toolInvocation を整理
    const mockMessage = {
      id: "test-message-2",
      role: "user",
      parts: [
        { type: "text", text: "表示されるテキスト" },
        // text 以外であれば何でもよいため、シンプルなオブジェクトにする
        {
          type: "tool-call",
          toolCallId: "call-id",
        },
      ],
    } as unknown as UIMessage;

    render(<UserMessage message={mockMessage} />);

    // テキストパーツは表示される
    expect(screen.getByText("表示されるテキスト")).toBeInTheDocument();

    // ツール呼び出しなどの要素が描画を阻害していないことを確認
    const textElement = screen.getByText("表示されるテキスト");
    expect(textElement.parentElement).not.toHaveTextContent("tool-call");
  });
});
