// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";

describe("ChainOfThought", () => {
  describe("基本レンダリング", () => {
    it("子要素をレンダリングする", () => {
      render(
        <ChainOfThought>
          <div data-testid="child">test content</div>
        </ChainOfThought>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("ChainOfThoughtHeader", () => {
    it("children未指定時にデフォルトテキストを表示する", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader />
        </ChainOfThought>
      );
      expect(screen.getByText("Chain of Thought")).toBeInTheDocument();
    });

    it("カスタムテキストを表示する", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader>考え中...</ChainOfThoughtHeader>
        </ChainOfThought>
      );
      expect(screen.getByText("考え中...")).toBeInTheDocument();
    });

    it("ChainOfThought外で使用するとエラー", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() =>
        render(<ChainOfThoughtHeader>Test</ChainOfThoughtHeader>)
      ).toThrow("ChainOfThought components must be used within ChainOfThought");
      vi.restoreAllMocks();
    });
  });

  describe("展開/折りたたみ動作", () => {
    it("デフォルトでコンテンツが非表示", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <div>Hidden content</div>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );
      expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
    });

    it("defaultOpen=trueでコンテンツが表示される", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <div>Visible content</div>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );
      expect(screen.getByText("Visible content")).toBeInTheDocument();
    });

    it("ヘッダーをクリックするとコンテンツが展開される", async () => {
      const user = userEvent.setup();
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <div>Expanded content</div>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.queryByText("Expanded content")).not.toBeInTheDocument();
      await user.click(screen.getByText("Thinking"));
      expect(screen.getByText("Expanded content")).toBeInTheDocument();
    });

    it("展開後に再クリックすると折りたたまれる", async () => {
      const user = userEvent.setup();
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <div>Content</div>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
      await user.click(screen.getByText("Thinking"));
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("onOpenChangeコールバックが呼ばれる", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(
        <ChainOfThought onOpenChange={onOpenChange}>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <div>Content</div>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      await user.click(screen.getByText("Thinking"));
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("open propで制御モードとして動作する", () => {
      const { rerender } = render(
        <ChainOfThought open={false}>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <div>Controlled content</div>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.queryByText("Controlled content")).not.toBeInTheDocument();

      rerender(
        <ChainOfThought open>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <div>Controlled content</div>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByText("Controlled content")).toBeInTheDocument();
    });
  });
});

describe("ChainOfThoughtStep", () => {
  it("ラベルを表示する", () => {
    render(
      <ChainOfThought>
        <ChainOfThoughtStep label="検索中" />
      </ChainOfThought>
    );
    expect(screen.getByText("検索中")).toBeInTheDocument();
  });

  it("descriptionを表示する", () => {
    render(
      <ChainOfThought>
        <ChainOfThoughtStep
          description="キーワードを検索しています"
          label="検索中"
        />
      </ChainOfThought>
    );
    expect(screen.getByText("キーワードを検索しています")).toBeInTheDocument();
  });

  it("description未指定時はdescriptionを表示しない", () => {
    render(
      <ChainOfThought>
        <ChainOfThoughtStep label="検索中" />
      </ChainOfThought>
    );
    expect(screen.getByText("検索中")).toBeInTheDocument();
    const stepContent = screen.getByText("検索中").parentElement;
    expect(stepContent?.children).toHaveLength(1);
  });

  it("子要素を表示する", () => {
    render(
      <ChainOfThought>
        <ChainOfThoughtStep label="検索中">
          <span data-testid="step-child">ステップの内容</span>
        </ChainOfThoughtStep>
      </ChainOfThought>
    );
    expect(screen.getByTestId("step-child")).toBeInTheDocument();
  });
});

describe("ChainOfThoughtSearchResults", () => {
  it("子要素をレンダリングする", () => {
    render(
      <ChainOfThoughtSearchResults>
        <ChainOfThoughtSearchResult>結果1</ChainOfThoughtSearchResult>
        <ChainOfThoughtSearchResult>結果2</ChainOfThoughtSearchResult>
      </ChainOfThoughtSearchResults>
    );
    expect(screen.getByText("結果1")).toBeInTheDocument();
    expect(screen.getByText("結果2")).toBeInTheDocument();
  });
});

describe("ChainOfThoughtImage", () => {
  it("子要素を表示する", () => {
    render(
      <ChainOfThoughtImage>
        {/* biome-ignore lint/performance/noImgElement: テスト用の簡易img要素 */}
        <img alt="テスト画像" src="/test.png" />
      </ChainOfThoughtImage>
    );
    expect(screen.getByAltText("テスト画像")).toBeInTheDocument();
  });

  it("captionを表示する", () => {
    render(
      <ChainOfThoughtImage caption="画像の説明">
        {/* biome-ignore lint/performance/noImgElement: テスト用の簡易img要素 */}
        <img alt="テスト画像" src="/test.png" />
      </ChainOfThoughtImage>
    );
    expect(screen.getByText("画像の説明")).toBeInTheDocument();
  });

  it("caption未指定時はcaptionを表示しない", () => {
    const { container } = render(
      <ChainOfThoughtImage>
        {/* biome-ignore lint/performance/noImgElement: テスト用の簡易img要素 */}
        <img alt="テスト画像" src="/test.png" />
      </ChainOfThoughtImage>
    );
    expect(container.querySelector("p")).toBeNull();
  });
});
