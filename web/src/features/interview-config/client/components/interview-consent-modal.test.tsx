// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { routes } from "@/lib/routes";
import { InterviewConsentModal } from "./interview-consent-modal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderModal() {
  render(<InterviewConsentModal open onOpenChange={vi.fn()} billId="bill-1" />);
}

describe("InterviewConsentModal", () => {
  it("オープンデータ提供の告知とデータ利用規約リンクを表示する", () => {
    renderModal();

    expect(
      screen.getByText(/第三者にオープンデータとして提供されることがあります/)
    ).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "みらい議会AIインタビューデータ利用規約",
    });
    expect(link).toHaveAttribute("href", routes.interviewDataTerms());
    expect(link).toHaveAttribute("target", "_blank");
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
