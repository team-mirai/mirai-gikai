// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createMockBill,
  createMockBillContent,
} from "@/app/dev/_lib/mock-data";
import { InterviewOpenBillSection } from "./interview-open-bill-section";

const billNamed = (id: string, title: string) =>
  createMockBill({
    id,
    hasPublicInterview: true,
    bill_content: createMockBillContent({
      title,
      summary: `${title}の要約`,
    }),
  });

describe("InterviewOpenBillSection", () => {
  it("見出しと議案を出す", () => {
    render(
      <InterviewOpenBillSection
        bills={[billNamed("a", "ガソリン税を安くする法案")]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "AIインタビュー受付中" })
    ).toBeInTheDocument();
    // 募集主体は解説記事。法案以外（検討会・報告書）も載るので「法案等」で受ける。
    expect(
      screen.getByText("意見を募集している法案等の解説記事")
    ).toBeInTheDocument();
    expect(screen.getByText("ガソリン税を安くする法案")).toBeInTheDocument();
  });

  // 受付中が無い日に見出しだけが残ると、出せる意見があるように見えてしまう。
  it("0件なら見出しごと出さない", () => {
    const { container } = render(<InterviewOpenBillSection bills={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("議案詳細へのリンクにする", () => {
    render(
      <InterviewOpenBillSection bills={[billNamed("bill-1", "対象の法案")]} />
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/bills/bill-1");
  });

  // 先頭だけフルカードにするので、要約が出るのは1件目だけになる。
  it("2件目以降はコンパクトカードにする", () => {
    render(
      <InterviewOpenBillSection
        bills={[billNamed("a", "1件目の法案"), billNamed("b", "2件目の法案")]}
      />
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("1件目の法案")).toBeInTheDocument();
    expect(screen.getByText("2件目の法案")).toBeInTheDocument();

    expect(screen.getByText("1件目の法案の要約")).toBeInTheDocument();
    expect(screen.queryByText("2件目の法案の要約")).not.toBeInTheDocument();
  });
});
