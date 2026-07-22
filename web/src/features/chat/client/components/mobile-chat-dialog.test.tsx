// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { MobileChatDialog } from "./mobile-chat-dialog";

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
});

function TestChatDialog({ disableAutoFocus = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>
        AIに質問する
      </button>
      <main>背景コンテンツ</main>
      <MobileChatDialog
        disableAutoFocus={disableAutoFocus}
        initialFocusRef={inputRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        returnFocusRef={triggerRef}
      >
        <label>
          質問
          <input ref={inputRef} />
        </label>
      </MobileChatDialog>
    </>
  );
}

describe("MobileChatDialog", () => {
  it("開くと名前付きモーダルになり、入力欄へフォーカスする", async () => {
    const user = userEvent.setup();
    render(<TestChatDialog />);

    await user.click(screen.getByRole("button", { name: "AIに質問する" }));

    expect(
      screen.getByRole("dialog", {
        name: "国会や法案についてAIに質問する",
      })
    ).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByText("背景コンテンツ").closest('[aria-hidden="true"]')
    ).not.toBeNull();
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "質問" })).toHaveFocus();
    });
  });

  it("フォーカスをダイアログ内に保ち、Escで閉じて起点へ戻す", async () => {
    const user = userEvent.setup();
    render(<TestChatDialog />);

    const trigger = screen.getByRole("button", { name: "AIに質問する" });
    await user.click(trigger);

    const input = screen.getByRole("textbox", { name: "質問" });
    await waitFor(() => expect(input).toHaveFocus());

    await user.tab();
    expect(
      screen.getByRole("button", { name: "AIチャットを閉じる" })
    ).toHaveFocus();
    await user.tab();
    expect(input).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(
        screen.getByText("背景コンテンツ").closest('[aria-hidden="true"]')
      ).toBeNull();
    });
  });

  it("本文選択から開いた場合は閉じるボタンを最初の操作先にする", async () => {
    const user = userEvent.setup();
    render(<TestChatDialog disableAutoFocus />);

    await user.click(screen.getByRole("button", { name: "AIに質問する" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "AIチャットを閉じる" })
      ).toHaveFocus();
    });
  });
});
