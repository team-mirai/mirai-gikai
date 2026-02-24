// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputError,
  PromptInputHint,
  PromptInputButton,
} from "./prompt-input";

// nanoid をモックして安定した ID を返す
vi.mock("nanoid", () => ({
  nanoid: () => "mock-id-1",
}));

describe("PromptInput", () => {
  describe("フォーム送信", () => {
    it("フォームsubmitイベントでonSubmitが呼ばれる", () => {
      const onSubmit = vi.fn();
      render(
        <PromptInput onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputSubmit data-testid="submit-btn" />
          </PromptInputToolbar>
        </PromptInput>
      );

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "テストメッセージ" } });

      // jsdomではform.message（名前付きフォーム要素アクセス）が未対応のため手動設定
      const form = textarea.closest("form") as HTMLFormElement;
      Object.defineProperty(form, "message", {
        value: textarea,
        configurable: true,
      });
      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "テストメッセージ",
          files: expect.any(Array),
        }),
        expect.any(Object)
      );
    });

    it("空文字でもフォームsubmitでonSubmitが呼ばれる", () => {
      const onSubmit = vi.fn();
      render(
        <PromptInput onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputSubmit data-testid="submit-btn" />
          </PromptInputToolbar>
        </PromptInput>
      );

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      const form = textarea.closest("form") as HTMLFormElement;
      Object.defineProperty(form, "message", {
        value: textarea,
        configurable: true,
      });
      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "",
          files: expect.any(Array),
        }),
        expect.any(Object)
      );
    });
  });

  describe("テキスト入力", () => {
    it("テキストエリアに文字が入力できる", () => {
      const onSubmit = vi.fn();
      render(
        <PromptInput onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
        </PromptInput>
      );

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "こんにちは" } });

      expect(textarea.value).toBe("こんにちは");
    });

    it("デフォルトプレースホルダーが表示される", () => {
      const onSubmit = vi.fn();
      render(
        <PromptInput onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
        </PromptInput>
      );

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.placeholder).toBe("What would you like to know?");
    });

    it("カスタムプレースホルダーを設定できる", () => {
      const onSubmit = vi.fn();
      render(
        <PromptInput onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="質問を入力" />
          </PromptInputBody>
        </PromptInput>
      );

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.placeholder).toBe("質問を入力");
    });

    it("onChangeコールバックが呼ばれる", () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <PromptInput onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputTextarea onChange={onChange} />
          </PromptInputBody>
        </PromptInput>
      );

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "a" } });

      expect(onChange).toHaveBeenCalled();
    });

    it("textareaのname属性が'message'に設定される", () => {
      const onSubmit = vi.fn();
      render(
        <PromptInput onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
        </PromptInput>
      );

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.name).toBe("message");
    });
  });
});

describe("PromptInputTextarea キーボードショートカット", () => {
  it("submitOnEnter=true: Enterキーでform.requestSubmitが呼ばれる", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputBody>
          <PromptInputTextarea submitOnEnter={true} />
        </PromptInputBody>
      </PromptInput>
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const form = textarea.closest("form") as HTMLFormElement;

    // requestSubmit をモックして呼び出しを検証
    const requestSubmitSpy = vi.fn();
    form.requestSubmit = requestSubmitSpy;

    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
    });

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it("submitOnEnter=true: Shift+Enterでは送信されない（改行）", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputBody>
          <PromptInputTextarea submitOnEnter={true} />
        </PromptInputBody>
      </PromptInput>
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const form = textarea.closest("form") as HTMLFormElement;
    const requestSubmitSpy = vi.fn();
    form.requestSubmit = requestSubmitSpy;

    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: true,
    });

    expect(requestSubmitSpy).not.toHaveBeenCalled();
  });

  it("submitOnEnter=false（デフォルト）: Enterキーで送信されない", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
      </PromptInput>
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const form = textarea.closest("form") as HTMLFormElement;
    const requestSubmitSpy = vi.fn();
    form.requestSubmit = requestSubmitSpy;

    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
    });

    expect(requestSubmitSpy).not.toHaveBeenCalled();
  });

  it("submitOnEnter=true: IME変換中はEnterで送信されない", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputBody>
          <PromptInputTextarea submitOnEnter={true} />
        </PromptInputBody>
      </PromptInput>
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const form = textarea.closest("form") as HTMLFormElement;
    const requestSubmitSpy = vi.fn();
    form.requestSubmit = requestSubmitSpy;

    // IME composition in progress: nativeEvent.isComposing = true
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
    });
    Object.defineProperty(event, "isComposing", { value: true });
    textarea.dispatchEvent(event);

    expect(requestSubmitSpy).not.toHaveBeenCalled();
  });
});

describe("PromptInputSubmit", () => {
  it("type=submitのボタンがレンダリングされる", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputSubmit data-testid="submit-btn" />
      </PromptInput>
    );

    const button = screen.getByTestId("submit-btn");
    expect(button).toBeTruthy();
    expect(button.getAttribute("type")).toBe("submit");
  });

  it("status=submitted: ローディングアイコン（animate-spin）が表示される", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputSubmit status="submitted" data-testid="submit-btn" />
      </PromptInput>
    );

    const button = screen.getByTestId("submit-btn");
    const svg = button.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains("animate-spin")).toBe(true);
  });

  it("status=streaming: 停止アイコンが表示される（animate-spinなし）", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputSubmit status="streaming" data-testid="submit-btn" />
      </PromptInput>
    );

    const button = screen.getByTestId("submit-btn");
    const svg = button.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains("animate-spin")).toBe(false);
  });

  it("status=error: 送信アイコンが表示される（エラー時も通常の送信アイコン）", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputSubmit status="error" data-testid="submit-btn" />
      </PromptInput>
    );

    const button = screen.getByTestId("submit-btn");
    const svg = button.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains("animate-spin")).toBe(false);
  });

  it("childrenを渡すとカスタムコンテンツが表示される", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputSubmit>カスタム送信</PromptInputSubmit>
      </PromptInput>
    );

    expect(screen.getByText("カスタム送信")).toBeTruthy();
  });
});

describe("PromptInputError", () => {
  it("status=errorかつerrorがある場合: エラーメッセージが表示される", () => {
    render(
      <PromptInputError
        status="error"
        error={new Error("接続エラーが発生しました")}
      />
    );

    expect(screen.getByText("接続エラーが発生しました")).toBeTruthy();
  });

  it("status=errorだがerrorがnull: 何も表示されない", () => {
    const { container } = render(
      <PromptInputError status="error" error={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("status=ready: 何も表示されない", () => {
    const { container } = render(
      <PromptInputError status="ready" error={new Error("エラー")} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("status未指定: 何も表示されない", () => {
    const { container } = render(
      <PromptInputError error={new Error("エラー")} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("PromptInputHint", () => {
  it("デフォルトのヒントテキストが表示される", () => {
    render(<PromptInputHint />);

    expect(
      screen.getByText(
        "AIの回答は間違えることがあります。重要な情報はご確認ください。"
      )
    ).toBeTruthy();
  });

  it("childrenを渡すとカスタムテキストが表示される", () => {
    render(<PromptInputHint>カスタムヒント</PromptInputHint>);

    expect(screen.getByText("カスタムヒント")).toBeTruthy();
  });
});

describe("PromptInputButton", () => {
  it("ボタンがレンダリングされる", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputButton>テスト</PromptInputButton>
      </PromptInput>
    );

    expect(screen.getByText("テスト")).toBeTruthy();
  });

  it("type=buttonが設定される（form送信を防ぐ）", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputButton data-testid="test-btn">テスト</PromptInputButton>
      </PromptInput>
    );

    expect(screen.getByTestId("test-btn").getAttribute("type")).toBe("button");
  });
});

describe("PromptInputToolbar / PromptInputTools / PromptInputBody", () => {
  it("レイアウトコンポーネントが正しくレンダリングされる", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputBody data-testid="body">
          <PromptInputTextarea />
        </PromptInputBody>
        <PromptInputToolbar data-testid="toolbar">
          <PromptInputTools data-testid="tools">
            <PromptInputButton>ツール</PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    );

    expect(screen.getByTestId("body")).toBeTruthy();
    expect(screen.getByTestId("toolbar")).toBeTruthy();
    expect(screen.getByTestId("tools")).toBeTruthy();
  });

  it("PromptInputにはhidden file inputが含まれる", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput onSubmit={onSubmit}>
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
      </PromptInput>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.className).toContain("hidden");
  });
});

describe("PromptInput ファイル添付", () => {
  beforeEach(() => {
    // URL.createObjectURL / revokeObjectURL をモック
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
  });

  it("maxFiles制限を超えるとonErrorが呼ばれる", () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();

    render(
      <PromptInput onSubmit={onSubmit} maxFiles={1} onError={onError}>
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
      </PromptInput>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file1 = new File(["content1"], "file1.txt", {
      type: "text/plain",
    });
    const file2 = new File(["content2"], "file2.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, {
      target: { files: [file1, file2] },
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "max_files",
        message: expect.any(String),
      })
    );
  });

  it("maxFileSize制限を超えるとonErrorが呼ばれる", () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();

    render(
      <PromptInput onSubmit={onSubmit} maxFileSize={10} onError={onError}>
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
      </PromptInput>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const largeFile = new File(["a".repeat(100)], "large.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, {
      target: { files: [largeFile] },
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "max_file_size",
      })
    );
  });

  it("accept=image/*のときimage以外のファイルはonError(accept)が呼ばれる", () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();

    render(
      <PromptInput onSubmit={onSubmit} accept="image/*" onError={onError}>
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
      </PromptInput>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const textFile = new File(["content"], "test.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, {
      target: { files: [textFile] },
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "accept",
      })
    );
  });

  it("accept=image/*のとき画像ファイルは受け入れられる", () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();

    render(
      <PromptInput onSubmit={onSubmit} accept="image/*" onError={onError}>
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
      </PromptInput>
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const imageFile = new File(["image-data"], "photo.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, {
      target: { files: [imageFile] },
    });

    // 画像ファイルの場合はエラーが発生しない
    expect(onError).not.toHaveBeenCalled();
  });
});
