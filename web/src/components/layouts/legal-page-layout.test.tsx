// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
  LegalSubSectionTitle,
} from "./legal-page-layout";

describe("LegalPageLayout", () => {
  it("タイトル・説明・本文を表示する", () => {
    render(
      <LegalPageLayout title="利用規約" description="説明文">
        <p>本文</p>
      </LegalPageLayout>
    );

    expect(
      screen.getByRole("heading", { name: "利用規約" })
    ).toBeInTheDocument();
    expect(screen.getByText("説明文")).toBeInTheDocument();
    expect(screen.getByText("本文")).toBeInTheDocument();
  });

  it("description 省略時は説明文を表示しない", () => {
    render(
      <LegalPageLayout title="規約">
        <p>本文</p>
      </LegalPageLayout>
    );

    expect(screen.getByRole("heading", { name: "規約" })).toBeInTheDocument();
  });
});

describe("見出し・段落コンポーネント", () => {
  it("セクション見出し・小見出し・段落を表示する", () => {
    render(
      <>
        <LegalSectionTitle>第1条</LegalSectionTitle>
        <LegalSubSectionTitle>小見出し</LegalSubSectionTitle>
        <LegalParagraph>段落テキスト</LegalParagraph>
      </>
    );

    expect(screen.getByRole("heading", { name: "第1条" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "小見出し" })
    ).toBeInTheDocument();
    expect(screen.getByText("段落テキスト")).toBeInTheDocument();
  });
});

describe("LegalList", () => {
  it("文字列項目とReactNode項目を混在して表示する", () => {
    render(
      <LegalList
        items={[
          "文字列の項目",
          { id: "node-item", content: <span>ノードの項目</span> },
        ]}
      />
    );

    expect(screen.getByText("文字列の項目")).toBeInTheDocument();
    expect(screen.getByText("ノードの項目")).toBeInTheDocument();
    expect(screen.getByRole("list").tagName).toBe("UL");
  });

  it("ordered 指定で番号付きリストになる", () => {
    render(<LegalList ordered items={["項目1"]} />);
    expect(screen.getByRole("list").tagName).toBe("OL");
  });
});
