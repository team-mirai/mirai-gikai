// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MakePublicModal } from "./make-public-modal";

describe("MakePublicModal", () => {
  it("オープンデータ提供の告知を表示し、確定で onConfirm を呼ぶ", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <MakePublicModal
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isSubmitting={false}
      />
    );

    expect(
      screen.getByText(/第三者にオープンデータとして提供されることがあります/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /公開にする/ }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
