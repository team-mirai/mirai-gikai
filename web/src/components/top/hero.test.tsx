// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("ページの主題をh1として伝え、スクロール表示を装飾扱いにする", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /いま国会で議論されていること\s*やさしい言葉で説明します/,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Scroll").parentElement).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });
});
