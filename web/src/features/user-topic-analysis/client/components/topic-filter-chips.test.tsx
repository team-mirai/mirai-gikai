// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TopicFilterChips } from "./topic-filter-chips";

describe("TopicFilterChips", () => {
  it("選択状態を通知し、フォーカスリングを打ち消さない", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <TopicFilterChips
        ariaLabel="回答を絞り込む"
        activeFilter="期待"
        onSelect={onSelect}
        counts={{
          affected: 0,
          industry: 0,
          expert: 0,
          citizen: 0,
          期待: 42,
          懸念: 2,
        }}
        countSuffix="人"
      />
    );

    const group = screen.getByRole("group", { name: "回答を絞り込む" });
    const allButton = within(group).getByRole("button", { name: "すべて" });
    const expectationButton = within(group).getByRole("button", {
      name: /期待\s*42人/,
    });
    const concernButton = within(group).getByRole("button", {
      name: /懸念\s*2人/,
    });

    expect(allButton).toHaveAttribute("aria-pressed", "false");
    expect(expectationButton).toHaveAttribute("aria-pressed", "true");
    expect(concernButton).toHaveAttribute("aria-pressed", "false");
    expect(expectationButton.className).not.toContain("focus-visible:ring-0");

    await user.click(concernButton);
    expect(onSelect).toHaveBeenCalledWith("懸念");
  });
});
