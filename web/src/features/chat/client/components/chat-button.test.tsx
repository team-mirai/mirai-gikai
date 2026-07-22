// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatButton, type ChatButtonRef } from "./chat-button";

const useChatMock = vi.hoisted(() => vi.fn());
const usePathnameMock = vi.hoisted(() => vi.fn());
const chatWindowMock = vi.hoisted(() => ({
  props: null as null | {
    disableAutoFocus: boolean;
    isOpen: boolean;
    onClose: () => void;
    returnFocusRef: { current: HTMLElement | null };
  },
}));

vi.mock("@ai-sdk/react", () => ({ useChat: useChatMock }));
vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
vi.mock("./chat-window", () => ({
  ChatWindow: (props: {
    disableAutoFocus: boolean;
    isOpen: boolean;
    onClose: () => void;
    returnFocusRef: { current: HTMLElement | null };
  }) => {
    chatWindowMock.props = props;
    return (
      <div data-testid="chat-window" data-open={props.isOpen}>
        <button type="button" onClick={props.onClose}>
          チャットを閉じる
        </button>
      </div>
    );
  },
}));

function renderChatButton(ref = createRef<ChatButtonRef>()) {
  const result = render(
    <ChatButton
      difficultyLevel="normal"
      pageContext={{ type: "home" }}
      ref={ref}
    />
  );
  return { ...result, ref };
}

beforeEach(() => {
  chatWindowMock.props = null;
  usePathnameMock.mockReturnValue("/bills/1");
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
    "00000000-0000-4000-8000-000000000001"
  );
});

describe("ChatButton", () => {
  it("トリガーの開閉状態とフォーカス復帰先をChatWindowへ渡す", async () => {
    const user = userEvent.setup();
    useChatMock.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
    });
    renderChatButton();

    const trigger = screen.getByRole("button", {
      name: "議案について質問する",
    });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(chatWindowMock.props?.returnFocusRef.current).toBe(trigger);

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("chat-window")).toHaveAttribute(
      "data-open",
      "true"
    );

    await user.click(screen.getByRole("button", { name: "チャットを閉じる" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("本文選択から開くと質問を送信し、閉じた後は通常のフォーカスに戻す", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    useChatMock.mockReturnValue({
      messages: [],
      sendMessage,
      status: "ready",
    });
    const { ref } = renderChatButton();

    act(() => ref.current?.openWithText("選択した本文"));

    expect(sendMessage).toHaveBeenCalledWith({
      text: "「選択した本文」について教えてください。",
      metadata: {
        billContext: undefined,
        difficultyLevel: "normal",
        hasInterviewConfig: undefined,
        pageContext: { type: "home" },
        sessionId: "00000000-0000-4000-8000-000000000001",
      },
    });
    expect(chatWindowMock.props?.disableAutoFocus).toBe(true);
    expect(chatWindowMock.props?.isOpen).toBe(true);

    act(() => chatWindowMock.props?.onClose());
    await user.click(
      screen.getByRole("button", { name: "議案について質問する" })
    );

    expect(chatWindowMock.props?.disableAutoFocus).toBe(false);
    expect(chatWindowMock.props?.isOpen).toBe(true);
  });

  it("AI応答中は本文選択から新しい質問を送信しない", () => {
    const sendMessage = vi.fn();
    useChatMock.mockReturnValue({
      messages: [],
      sendMessage,
      status: "streaming",
    });
    const { ref } = renderChatButton();

    act(() => ref.current?.openWithText("選択した本文"));

    expect(sendMessage).not.toHaveBeenCalled();
    expect(chatWindowMock.props?.isOpen).toBe(false);
  });
});
