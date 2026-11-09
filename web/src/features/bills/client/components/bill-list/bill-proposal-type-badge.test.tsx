// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillProposalTypeBadge } from "./bill-proposal-type-badge";

describe("BillProposalTypeBadge", () => {
  it("閣法は「閣法」をグリーンの枠で出す", () => {
    render(<BillProposalTypeBadge proposalType="cabinet" />);

    expect(screen.getByText("閣法")).toHaveClass(
      "border-primary",
      "text-primary-accent"
    );
  });

  it("議員立法は「議員立法」をグレーの枠で出す", () => {
    render(<BillProposalTypeBadge proposalType="member" />);

    expect(screen.getByText("議員立法")).toHaveClass(
      "border-mirai-border",
      "text-mirai-text-note"
    );
  });
});
