// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupplementaryResolutionsSection } from "./supplementary-resolutions-section";

describe("SupplementaryResolutionsSection", () => {
  it("院ごとに賛否・内容・重視した事項・理由・リンクを出す", () => {
    render(
      <SupplementaryResolutionsSection
        resolutions={[
          {
            house: "HR",
            stance: "for",
            content: "施行状況を検証すること",
            reference_url: "https://example.com/r",
            focus_points: "施行後の検証",
            reason: "必要な配慮のため",
          },
          {
            house: "HC",
            stance: "against",
            content: null,
            reference_url: null,
            focus_points: null,
            reason: null,
          },
        ]}
      />
    );

    expect(screen.getByText("衆議院の附帯決議")).toBeInTheDocument();
    expect(screen.getByText("チームみらいは賛成")).toBeInTheDocument();
    expect(screen.getByText("施行状況を検証すること")).toBeInTheDocument();
    expect(screen.getByText("施行後の検証")).toBeInTheDocument();
    expect(screen.getByText("必要な配慮のため")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "附帯決議の全文を見る" })
    ).toHaveAttribute("href", "https://example.com/r");

    expect(screen.getByText("参議院の附帯決議")).toBeInTheDocument();
    expect(screen.getByText("チームみらいは反対")).toBeInTheDocument();
    // 任意項目が無い院では見出しも出さない
    expect(screen.getAllByText("理由")).toHaveLength(1);
  });
});
