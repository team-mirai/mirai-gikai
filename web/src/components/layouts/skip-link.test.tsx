// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("キーボード利用者を本文ランドマークへ移動できる", () => {
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: "本文へ移動" });
    expect(link).toHaveAttribute("href", "#main-content");
    expect(link.className).toContain("focus:not-sr-only");
  });
});
