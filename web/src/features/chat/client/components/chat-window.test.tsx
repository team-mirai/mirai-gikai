// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, FormEvent, ReactNode } from "react";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatWindow } from "./chat-window";

const testState = vi.hoisted(() => ({
  isDesktop: false,
  isPc: false,
  scrollToBottom: vi.fn(),
  viewportHeight: 640 as number | null,
  mobileDialogProps: null as null | Record<string, unknown>,
}));

vi.mock("@/hooks/use-is-desktop", () => ({
  useIsDesktop: () => testState.isDesktop,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => testState.isPc,
}));

vi.mock("@/hooks/use-viewport-height", () => ({
  useViewportHeight: () => testState.viewportHeight,
}));

vi.mock("use-stick-to-bottom", () => ({
  useStickToBottomContext: () => ({
    scrollToBottom: testState.scrollToBottom,
  }),
}));

vi.mock("@/components/ai-elements/conversation", () => ({
  Conversation: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  ConversationContent: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  ConversationScrollButton: () => null,
}));

vi.mock("@/components/ai-elements/prompt-input", () => ({
  PromptInput: ({
    children,
    onSubmit,
    ...props
  }: ComponentProps<"form"> & {
    onSubmit: (
      message: { text?: string },
      event: FormEvent<HTMLFormElement>
    ) => void;
  }) => (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({ text: String(formData.get("message") ?? "") }, event);
      }}
    >
      {children}
    </form>
  ),
  PromptInputBody: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  PromptInputTextarea: forwardRef<
    HTMLTextAreaElement,
    ComponentProps<"textarea"> & { submitOnEnter?: boolean }
  >(({ submitOnEnter: _submitOnEnter, ...props }, ref) => (
    <textarea {...props} name="message" ref={ref} />
  )),
  PromptInputError: ({
    error,
    status,
  }: {
    error?: Error | null;
    status?: string;
  }) => (status === "error" && error ? <div>{error.message}</div> : null),
  PromptInputHint: () => <div>回答確認の注意</div>,
}));

vi.mock("./mobile-chat-dialog", () => ({
  CHAT_PANEL_RESPONSIVE_CLASSES:
    "md:bottom-4 md:right-4 md:left-auto md:w-[450px] md:rounded-2xl",
  MobileChatDialog: (props: {
    children: ReactNode;
    disableAutoFocus?: boolean;
    initialFocusRef: { current: HTMLElement | null };
    isOpen: boolean;
    onClose: () => void;
    returnFocusRef: { current: HTMLElement | null };
    style?: React.CSSProperties;
  }) => {
    testState.mobileDialogProps = props;
    if (!props.isOpen) {
      return null;
    }
    return (
      <div role="dialog" aria-label="モバイルAIチャット" style={props.style}>
        <button type="button" onClick={props.onClose}>
          閉じる
        </button>
        {props.children}
      </div>
    );
  },
}));

vi.mock("./system-message", () => ({
  SystemMessage: ({
    isStreaming,
    message,
  }: {
    isStreaming: boolean;
    message: { id: string };
  }) => (
    <div data-testid={`system-${message.id}`} data-streaming={isStreaming} />
  ),
}));

vi.mock("./user-message", () => ({
  UserMessage: ({ message }: { message: { id: string } }) => (
    <div data-testid={`user-${message.id}`} />
  ),
}));

type ChatState = ReturnType<typeof import("@ai-sdk/react").useChat>;

function createChatState(overrides: Record<string, unknown> = {}) {
  return {
    error: null,
    messages: [],
    sendMessage: vi.fn(),
    status: "ready",
    ...overrides,
  } as unknown as ChatState;
}

function renderChatWindow(chatState = createChatState(), extraProps = {}) {
  const returnFocusElement = document.createElement("button");
  const returnFocusRef = { current: returnFocusElement };
  const onClose = vi.fn();
  const result = render(
    <ChatWindow
      chatState={chatState}
      difficultyLevel="normal"
      isOpen
      onClose={onClose}
      pageContext={{ type: "home" }}
      returnFocusRef={returnFocusRef}
      sessionId="session-1"
      {...extraProps}
    />
  );
  return { ...result, onClose, returnFocusRef };
}

beforeEach(() => {
  testState.isDesktop = false;
  testState.isPc = false;
  testState.viewportHeight = 640;
  testState.mobileDialogProps = null;
  testState.scrollToBottom.mockReset();
});

describe("ChatWindow", () => {
  it("モバイル表示で質問候補と入力内容を文脈付きで送信する", async () => {
    const user = userEvent.setup();
    const chatState = createChatState();
    const sendMessage = chatState.sendMessage as ReturnType<typeof vi.fn>;
    const { onClose, returnFocusRef } = renderChatWindow(chatState, {
      disableAutoFocus: true,
    });

    const dialog = await screen.findByRole("dialog", {
      name: "モバイルAIチャット",
    });
    expect(dialog).toHaveStyle({ maxHeight: "640px" });
    expect(screen.getAllByRole("button", { name: /何|法案/ })).toHaveLength(3);

    await user.click(
      screen.getByRole("button", { name: "みらい議会って何？" })
    );
    expect(sendMessage).toHaveBeenCalledWith({
      text: "みらい議会って何？",
      metadata: {
        billContext: undefined,
        difficultyLevel: "normal",
        hasInterviewConfig: undefined,
        pageContext: { type: "home" },
        sessionId: "session-1",
      },
    });

    sendMessage.mockClear();
    const textarea = screen.getByRole("textbox", {
      name: "",
    }) as HTMLTextAreaElement;
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 72,
    });
    const form = textarea.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: "予算への影響は？" } });
    expect(textarea).toHaveStyle({ height: "72px" });
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(sendMessage).toHaveBeenCalledWith({
      text: "予算への影響は？",
      metadata: {
        billContext: undefined,
        difficultyLevel: "normal",
        hasInterviewConfig: undefined,
        pageContext: { type: "home" },
        sessionId: "session-1",
      },
    });
    expect(textarea).toHaveValue("");
    expect(testState.mobileDialogProps?.returnFocusRef).toBe(returnFocusRef);
    expect(testState.mobileDialogProps?.disableAutoFocus).toBe(true);
    expect(
      (testState.mobileDialogProps?.initialFocusRef as { current: unknown })
        .current
    ).toBe(textarea);

    await user.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("PC表示ではモーダルではなく常設の補助領域をPortal表示する", async () => {
    testState.isDesktop = true;
    testState.isPc = true;

    renderChatWindow(createChatState(), { isOpen: false });

    expect(
      await screen.findByRole("region", {
        name: "国会や法案についてAIに質問する",
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("応答中は再送を止め、メッセージと進行状態を表示する", async () => {
    testState.viewportHeight = null;
    const chatState = createChatState({
      messages: [
        { id: "user-1", role: "user" },
        { id: "assistant-1", role: "assistant" },
      ],
      status: "streaming",
    });
    const sendMessage = chatState.sendMessage as ReturnType<typeof vi.fn>;
    const { rerender, returnFocusRef, onClose } = renderChatWindow(chatState, {
      billContext: { id: "bill-1", name: "法案A" },
    });

    await screen.findByRole("dialog");
    expect(testState.mobileDialogProps?.style).toBeUndefined();
    expect(screen.getAllByRole("button", { name: /法案/ })).toHaveLength(2);
    expect(screen.getByTestId("user-user-1")).toBeInTheDocument();
    expect(screen.getByTestId("system-assistant-1")).toHaveAttribute(
      "data-streaming",
      "true"
    );
    expect(screen.getByText("回答確認の注意")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "送信" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "この法案のポイントは？" })
    ).toBeDisabled();
    await waitFor(() => expect(testState.scrollToBottom).toHaveBeenCalled());

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "再送しない質問" } });
    fireEvent.submit(textarea.closest("form") as HTMLFormElement);
    expect(sendMessage).not.toHaveBeenCalled();

    rerender(
      <ChatWindow
        billContext={{ id: "bill-1", name: "法案A" } as never}
        chatState={createChatState({
          messages: [{ id: "assistant-2", role: "assistant" }],
          status: "submitted",
        })}
        difficultyLevel="normal"
        isOpen
        onClose={onClose}
        returnFocusRef={returnFocusRef}
        sessionId="session-1"
      />
    );

    expect(await screen.findByText("考え中...")).toBeInTheDocument();
  });
});
