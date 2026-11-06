// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DifficultySelector } from "./difficulty-selector";

/*
  切り替えたあとに押す先が変わったように見えるのを避けるため、
  文言は難易度によらず「説明をもっと詳しく」で固定する。
  ここではその固定と、トグルのオンオフが難易度に対応することを見る。
*/
describe("DifficultySelector", () => {
  it("normalでもhardでも同じラベルを出す", () => {
    const { unmount } = render(<DifficultySelector currentLevel="normal" />);
    expect(screen.getByText("説明をもっと")).toBeInTheDocument();
    expect(screen.getByText("詳しく")).toBeInTheDocument();
    unmount();

    render(<DifficultySelector currentLevel="hard" />);
    expect(screen.getByText("説明をもっと")).toBeInTheDocument();
    expect(screen.getByText("詳しく")).toBeInTheDocument();
  });

  it("hardのときだけトグルがオンになる", () => {
    const { unmount } = render(<DifficultySelector currentLevel="normal" />);
    expect(
      screen.getByRole("switch", { name: "説明をもっと詳しく" })
    ).not.toBeChecked();
    unmount();

    render(<DifficultySelector currentLevel="hard" />);
    expect(
      screen.getByRole("switch", { name: "説明をもっと詳しく" })
    ).toBeChecked();
  });
});
