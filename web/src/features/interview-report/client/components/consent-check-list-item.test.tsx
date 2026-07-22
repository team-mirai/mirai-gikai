// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";
import {
  ConsentCheckListItem,
  OpenDataNoticeItem,
} from "./consent-check-list-item";

describe("ConsentCheckListItem", () => {
  it("children を表示する", () => {
    render(<ConsentCheckListItem>テスト項目</ConsentCheckListItem>);
    expect(screen.getByText("テスト項目")).toBeInTheDocument();
  });
});

describe("OpenDataNoticeItem", () => {
  it("データ利用規約への別タブリンク付きで二次利用の告知を表示する", () => {
    render(<OpenDataNoticeItem />);

    const link = screen.getByRole("link", {
      name: "みらい議会AIインタビューデータ利用規約",
    });
    expect(link).toHaveAttribute("href", routes.interviewDataTerms());
    expect(link).toHaveAttribute("target", "_blank");

    expect(
      screen.getByText(/第三者にオープンデータとして提供されることがあります/)
    ).toBeInTheDocument();
  });
});
