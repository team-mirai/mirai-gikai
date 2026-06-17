// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatLogSection } from "./chat-log-section";

describe("ChatLogSection", () => {
  it("renders assistant JSON text and user messages", () => {
    render(
      <ChatLogSection
        messages={[
          {
            id: "assistant-1",
            role: "assistant",
            content: JSON.stringify({ text: "AIからの質問です" }),
          },
          {
            id: "user-1",
            role: "user",
            content: "ユーザーの回答です",
          },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "🎤すべての会話ログ" })
    ).toBeInTheDocument();
    expect(screen.getByText("AIからの質問です")).toBeInTheDocument();
    expect(screen.getByText("ユーザーの回答です")).toBeInTheDocument();
    expect(document.querySelector("#message-assistant-1")).toBeInTheDocument();
    expect(document.querySelector("#message-user-1")).toBeInTheDocument();
  });

  it("renders nothing when there are no messages", () => {
    const { container } = render(<ChatLogSection messages={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("highlights only the message matching highlightMessageId", () => {
    render(
      <ChatLogSection
        messages={[
          { id: "m1", role: "user", content: "同じ引用文です" },
          { id: "m2", role: "user", content: "同じ引用文です" },
        ]}
        highlightQuote="引用文"
        highlightMessageId="m2"
      />
    );

    // 対象外メッセージ(m1)は同じ文言でも太字化しない
    expect(document.querySelector("#message-m1 strong")).toBeNull();
    // 対象メッセージ(m2)のみ太字化する
    expect(document.querySelector("#message-m2 strong")).toBeInTheDocument();
  });

  it("falls back to highlighting all matches when no highlightMessageId", () => {
    render(
      <ChatLogSection
        messages={[
          { id: "m1", role: "user", content: "同じ引用文です" },
          { id: "m2", role: "user", content: "同じ引用文です" },
        ]}
        highlightQuote="引用文"
      />
    );

    expect(document.querySelector("#message-m1 strong")).toBeInTheDocument();
    expect(document.querySelector("#message-m2 strong")).toBeInTheDocument();
  });
});
