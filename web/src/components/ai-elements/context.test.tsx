// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { LanguageModelUsage } from "ai";
import { describe, expect, it } from "vitest";
import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from "./context";

const createUsage = (
  overrides: Partial<LanguageModelUsage> = {}
): LanguageModelUsage => ({
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  inputTokenDetails: {
    noCacheTokens: undefined,
    cacheReadTokens: undefined,
    cacheWriteTokens: undefined,
  },
  outputTokenDetails: {
    textTokens: undefined,
    reasoningTokens: undefined,
  },
  ...overrides,
});

const defaultProps = {
  usedTokens: 5000,
  maxTokens: 10000,
};

const Wrapper = ({
  children,
  ...props
}: React.PropsWithChildren<Partial<React.ComponentProps<typeof Context>>>) => (
  <Context {...defaultProps} {...props}>
    {children}
  </Context>
);

describe("context.tsx", () => {
  describe("useContextValue", () => {
    it("Context外で使用するとエラーをthrowする", () => {
      const consoleError = console.error;
      console.error = () => {};
      expect(() => render(<ContextTrigger />)).toThrow(
        "Context components must be used within Context"
      );
      console.error = consoleError;
    });
  });

  describe("ContextTrigger", () => {
    it("使用率をパーセント表示する", () => {
      render(
        <Wrapper>
          <ContextTrigger />
        </Wrapper>
      );
      expect(screen.getByText("50%")).toBeDefined();
    });

    it("小数点以下の使用率を正しくフォーマットする", () => {
      render(
        <Wrapper usedTokens={3333} maxTokens={10000}>
          <ContextTrigger />
        </Wrapper>
      );
      expect(screen.getByText("33.3%")).toBeDefined();
    });

    it("SVGアイコンを表示する", () => {
      render(
        <Wrapper>
          <ContextTrigger />
        </Wrapper>
      );
      expect(
        screen.getByRole("img", { name: "Model context usage" })
      ).toBeDefined();
    });

    it("childrenが渡された場合はそちらを表示する", () => {
      render(
        <Wrapper>
          <ContextTrigger>
            <button type="button">カスタムトリガー</button>
          </ContextTrigger>
        </Wrapper>
      );
      expect(screen.getByText("カスタムトリガー")).toBeDefined();
    });
  });

  describe("ContextContent", () => {
    it("エラーなくレンダリングできる", () => {
      expect(() =>
        render(
          <Wrapper>
            <ContextContent className="test-class">
              <div>content</div>
            </ContextContent>
          </Wrapper>
        )
      ).not.toThrow();
    });
  });

  describe("ContextContentHeader", () => {
    it("使用率パーセントとトークン数を表示する", () => {
      render(
        <Wrapper usedTokens={5000} maxTokens={10000}>
          <ContextContentHeader data-testid="header" />
        </Wrapper>
      );
      const header = screen.getByTestId("header");
      expect(header.textContent).toContain("50%");
      expect(header.textContent).toContain("5K");
      expect(header.textContent).toContain("10K");
    });

    it("大きな数値をコンパクト表記でフォーマットする", () => {
      render(
        <Wrapper usedTokens={1500000} maxTokens={2000000}>
          <ContextContentHeader data-testid="header" />
        </Wrapper>
      );
      const header = screen.getByTestId("header");
      expect(header.textContent).toContain("75%");
      expect(header.textContent).toContain("2M");
    });

    it("childrenが渡された場合はそちらを表示する", () => {
      render(
        <Wrapper>
          <ContextContentHeader>
            <span>カスタムヘッダー</span>
          </ContextContentHeader>
        </Wrapper>
      );
      expect(screen.getByText("カスタムヘッダー")).toBeDefined();
    });
  });

  describe("ContextContentBody", () => {
    it("childrenを表示する", () => {
      render(
        <Wrapper>
          <ContextContentBody>
            <span>ボディコンテンツ</span>
          </ContextContentBody>
        </Wrapper>
      );
      expect(screen.getByText("ボディコンテンツ")).toBeDefined();
    });

    it("classNameを受け取れる", () => {
      render(
        <Wrapper>
          <ContextContentBody className="custom-body" data-testid="body">
            content
          </ContextContentBody>
        </Wrapper>
      );
      expect(screen.getByTestId("body").className).toContain("custom-body");
    });
  });

  describe("ContextContentFooter", () => {
    it("modelIdとusageが指定された場合コストを表示する", () => {
      render(
        <Wrapper
          usedTokens={5000}
          maxTokens={10000}
          modelId="gpt-4o"
          usage={createUsage({
            inputTokens: 1000,
            outputTokens: 500,
            totalTokens: 1500,
          })}
        >
          <ContextContentFooter data-testid="footer" />
        </Wrapper>
      );
      const footer = screen.getByTestId("footer");
      expect(footer.textContent).toContain("Total cost");
      expect(footer.textContent).toContain("$");
    });

    it("modelIdがない場合は$0.00を表示する", () => {
      render(
        <Wrapper usedTokens={5000} maxTokens={10000}>
          <ContextContentFooter data-testid="footer" />
        </Wrapper>
      );
      const footer = screen.getByTestId("footer");
      expect(footer.textContent).toContain("$0.00");
    });

    it("childrenが渡された場合はそちらを表示する", () => {
      render(
        <Wrapper>
          <ContextContentFooter>
            <span>カスタムフッター</span>
          </ContextContentFooter>
        </Wrapper>
      );
      expect(screen.getByText("カスタムフッター")).toBeDefined();
    });
  });

  describe("ContextInputUsage", () => {
    it("inputTokensが0の場合nullを返す", () => {
      const { container } = render(
        <Wrapper modelId="gpt-4o" usage={createUsage()}>
          <ContextInputUsage data-testid="input-usage" />
        </Wrapper>
      );
      expect(container.querySelector('[data-testid="input-usage"]')).toBeNull();
    });

    it("inputTokensがある場合Inputラベルとトークン数を表示する", () => {
      render(
        <Wrapper
          modelId="gpt-4o"
          usage={createUsage({
            inputTokens: 1000,
            totalTokens: 1000,
          })}
        >
          <ContextInputUsage data-testid="input-usage" />
        </Wrapper>
      );
      const el = screen.getByTestId("input-usage");
      expect(el.textContent).toContain("Input");
      expect(el.textContent).toContain("1K");
    });

    it("usageが未設定の場合nullを返す", () => {
      const { container } = render(
        <Wrapper>
          <ContextInputUsage data-testid="input-usage" />
        </Wrapper>
      );
      expect(container.querySelector('[data-testid="input-usage"]')).toBeNull();
    });

    it("childrenが渡された場合はそちらを表示する", () => {
      render(
        <Wrapper>
          <ContextInputUsage>
            <span>カスタム入力</span>
          </ContextInputUsage>
        </Wrapper>
      );
      expect(screen.getByText("カスタム入力")).toBeDefined();
    });
  });

  describe("ContextOutputUsage", () => {
    it("outputTokensが0の場合nullを返す", () => {
      const { container } = render(
        <Wrapper modelId="gpt-4o" usage={createUsage()}>
          <ContextOutputUsage data-testid="output-usage" />
        </Wrapper>
      );
      expect(
        container.querySelector('[data-testid="output-usage"]')
      ).toBeNull();
    });

    it("outputTokensがある場合Outputラベルとトークン数を表示する", () => {
      render(
        <Wrapper
          modelId="gpt-4o"
          usage={createUsage({
            outputTokens: 2000,
            totalTokens: 2000,
          })}
        >
          <ContextOutputUsage data-testid="output-usage" />
        </Wrapper>
      );
      const el = screen.getByTestId("output-usage");
      expect(el.textContent).toContain("Output");
      expect(el.textContent).toContain("2K");
    });

    it("childrenが渡された場合はそちらを表示する", () => {
      render(
        <Wrapper>
          <ContextOutputUsage>
            <span>カスタム出力</span>
          </ContextOutputUsage>
        </Wrapper>
      );
      expect(screen.getByText("カスタム出力")).toBeDefined();
    });
  });

  describe("ContextReasoningUsage", () => {
    it("reasoningTokensが0の場合nullを返す", () => {
      const { container } = render(
        <Wrapper modelId="gpt-4o" usage={createUsage({ reasoningTokens: 0 })}>
          <ContextReasoningUsage data-testid="reasoning-usage" />
        </Wrapper>
      );
      expect(
        container.querySelector('[data-testid="reasoning-usage"]')
      ).toBeNull();
    });

    it("reasoningTokensがある場合Reasoningラベルとトークン数を表示する", () => {
      render(
        <Wrapper
          modelId="gpt-4o"
          usage={createUsage({
            totalTokens: 3000,
            reasoningTokens: 3000,
          })}
        >
          <ContextReasoningUsage data-testid="reasoning-usage" />
        </Wrapper>
      );
      const el = screen.getByTestId("reasoning-usage");
      expect(el.textContent).toContain("Reasoning");
      expect(el.textContent).toContain("3K");
    });

    it("childrenが渡された場合はそちらを表示する", () => {
      render(
        <Wrapper>
          <ContextReasoningUsage>
            <span>カスタム推論</span>
          </ContextReasoningUsage>
        </Wrapper>
      );
      expect(screen.getByText("カスタム推論")).toBeDefined();
    });
  });

  describe("ContextCacheUsage", () => {
    it("cachedInputTokensが0の場合nullを返す", () => {
      const { container } = render(
        <Wrapper modelId="gpt-4o" usage={createUsage({ cachedInputTokens: 0 })}>
          <ContextCacheUsage data-testid="cache-usage" />
        </Wrapper>
      );
      expect(container.querySelector('[data-testid="cache-usage"]')).toBeNull();
    });

    it("cachedInputTokensがある場合Cacheラベルとトークン数を表示する", () => {
      render(
        <Wrapper
          modelId="gpt-4o"
          usage={createUsage({
            totalTokens: 4000,
            cachedInputTokens: 4000,
          })}
        >
          <ContextCacheUsage data-testid="cache-usage" />
        </Wrapper>
      );
      const el = screen.getByTestId("cache-usage");
      expect(el.textContent).toContain("Cache");
      expect(el.textContent).toContain("4K");
    });

    it("childrenが渡された場合はそちらを表示する", () => {
      render(
        <Wrapper>
          <ContextCacheUsage>
            <span>カスタムキャッシュ</span>
          </ContextCacheUsage>
        </Wrapper>
      );
      expect(screen.getByText("カスタムキャッシュ")).toBeDefined();
    });
  });
});
