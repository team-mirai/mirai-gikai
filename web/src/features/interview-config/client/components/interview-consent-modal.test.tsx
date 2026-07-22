// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InterviewConsentModal } from "./interview-consent-modal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderModal() {
  render(<InterviewConsentModal open onOpenChange={vi.fn()} billId="bill-1" />);
}

describe("InterviewConsentModal", () => {
  it("開始前モーダルにはオープンデータ提供の告知を表示しない", () => {
    renderModal();

    expect(
      screen.queryByText(/第三者にオープンデータとして提供されることがあります/)
    ).toBeNull();
    expect(
      screen.queryByRole("link", {
        name: "みらい議会AIインタビューデータ利用規約",
      })
    ).toBeNull();
  });

  it("規約同意のチェックを入れるまで開始ボタンが無効", async () => {
    const user = userEvent.setup();
    renderModal();

    const startButton = screen.getByRole("button", {
      name: /同意してはじめる/,
    });
    expect(startButton).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(startButton).toBeEnabled();
  });
});
