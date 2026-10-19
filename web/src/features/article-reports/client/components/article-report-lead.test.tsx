// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArticleReportLead } from "./article-report-lead";

describe("ArticleReportLead", () => {
  it("onOpen があるときはリンク付きの文言を出し、押すと onOpen を呼ぶ", async () => {
    const onOpen = vi.fn();
    const { container } = render(<ArticleReportLead onOpen={onOpen} />);

    expect(container).toHaveTextContent(
      "この記事はAIが作成しています。誤りやお気づきの点がありましたら、こちらからお知らせください。"
    );

    await userEvent.click(screen.getByRole("button", { name: "こちらから" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("onOpen がないときはリンクなしの文言を出す", () => {
    const { container } = render(<ArticleReportLead />);

    expect(container).toHaveTextContent(
      "この記事はAIが作成しています。誤りやお気づきの点がありましたら、お知らせください。"
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
