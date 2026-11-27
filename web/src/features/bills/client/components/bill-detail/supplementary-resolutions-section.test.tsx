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

    expect(
      screen.getByRole("heading", { name: "📜附帯決議への賛否" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "衆議院の附帯決議" })
    ).toBeInTheDocument();
    expect(screen.getByText("賛成")).toBeInTheDocument();
    expect(screen.getByText("施行状況を検証すること")).toBeInTheDocument();
    expect(screen.getByText("施行後の検証")).toBeInTheDocument();
    expect(screen.getByText("必要な配慮のため")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "衆議院の附帯決議" })
    ).toHaveAttribute("href", "https://example.com/r");

    expect(
      screen.getByRole("heading", { name: "参議院の附帯決議" })
    ).toBeInTheDocument();
    expect(screen.getByText("反対")).toBeInTheDocument();
    // 任意項目が無い院では見出しも出さない
    expect(screen.getAllByText("理由")).toHaveLength(1);
    expect(screen.getAllByText("附帯決議の内容")).toHaveLength(1);
    expect(screen.getAllByText("参考リンク")).toHaveLength(1);
  });

  it("1院だけなら院名の見出しは出さない", () => {
    render(
      <SupplementaryResolutionsSection
        resolutions={[
          {
            house: "HR",
            stance: "for",
            content: null,
            reference_url: null,
            focus_points: null,
            reason: null,
          },
        ]}
      />
    );

    expect(
      screen.queryByRole("heading", { name: "衆議院の附帯決議" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("賛成")).toBeInTheDocument();
  });
});
