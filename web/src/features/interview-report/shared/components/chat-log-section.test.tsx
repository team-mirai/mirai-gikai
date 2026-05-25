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
});
