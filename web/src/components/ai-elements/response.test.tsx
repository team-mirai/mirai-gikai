import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "./response";
import { Streamdown } from "streamdown";
import rehypeSanitize from "rehype-sanitize";

// 1. Streamdown コンポーネントをモック化
vi.mock("streamdown", () => ({
  Streamdown: vi.fn(({ children, className, rehypePlugins }) => (
    <div
      data-testid="streamdown-mock"
      className={className}
      // モックコンポーネントの属性に値を持たせて検証しやすくする
      data-has-plugins={!!rehypePlugins}
    >
      {children}
    </div>
  )),
}));

// 2. cn ユーティリティが正しく動く前提でテストするため、必要に応じてモック化も可能ですが、
// 通常はそのままの実装を使います。ここではそのまま使う想定です。

describe("Response Component", () => {
  beforeEach(() => {
    // 各テストの前にモックの呼び出し履歴をクリアする
    vi.clearAllMocks();
  });

  it("正常にレンダリングされ、childrenが渡されること", () => {
    render(<Response>テストコンテンツ</Response>);

    const element = screen.getByTestId("streamdown-mock");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("テストコンテンツ");
  });

  it("デフォルトのクラス名とカスタムのクラス名がマージされて適用されること", () => {
    render(<Response className="custom-class">テストコンテンツ</Response>);

    const element = screen.getByTestId("streamdown-mock");

    // デフォルトで付与されるクラスが含まれているか
    expect(element).toHaveClass("size-full");
    // カスタムクラスが含まれているか
    expect(element).toHaveClass("custom-class");
  });

  it("デフォルトの rehypePlugins (rehypeSanitize, harden) が渡されること", () => {
    render(<Response>テストコンテンツ</Response>);

    // Streamdownコンポーネントに渡されたPropsを取得
    const streamdownProps = vi.mocked(Streamdown).mock.calls[0][0];

    expect(streamdownProps.rehypePlugins).toBeDefined();
    // デフォルトで最低2つのプラグインが設定されているはず
    expect(streamdownProps.rehypePlugins?.length).toBeGreaterThanOrEqual(2);

    // 最初のプラグインが rehypeSanitize であることを確認
    expect(streamdownProps.rehypePlugins?.[0]).toBe(rehypeSanitize);
  });

  it("カスタムの rehypePlugins を渡した場合、デフォルトのプラグインに追加されること", () => {
    const mockCustomPlugin = vi.fn();
    render(
      <Response rehypePlugins={[mockCustomPlugin]}>テストコンテンツ</Response>
    );

    const streamdownProps = vi.mocked(Streamdown).mock.calls[0][0];

    // カスタムプラグインが配列の中に含まれているか
    expect(streamdownProps.rehypePlugins).toContain(mockCustomPlugin);

    // 配列の長さが3以上になっているか (rehypeSanitize, harden設定, mockCustomPlugin)
    expect(streamdownProps.rehypePlugins?.length).toBeGreaterThanOrEqual(3);
  });
});
