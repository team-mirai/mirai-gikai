// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted で mock factory より先に初期化
const { mockSubmit, mockState } = vi.hoisted(() => {
  const mockSubmit = vi.fn();
  const mockState = {
    onFinish: undefined as
      | ((result: { object?: unknown; error?: Error }) => void)
      | undefined,
    isLoading: false,
    returnedObject: undefined as unknown,
  };
  return { mockSubmit, mockState };
});

vi.mock("@ai-sdk/react", () => ({
  experimental_useObject: vi.fn(
    (options: {
      api: string;
      schema: unknown;
      onFinish?: (result: { object?: unknown; error?: Error }) => void;
    }) => {
      mockState.onFinish = options.onFinish;
      return {
        object: mockState.returnedObject,
        submit: mockSubmit,
        isLoading: mockState.isLoading,
        error: undefined,
      };
    }
  ),
}));

import { useInterviewChat } from "./use-interview-chat";

const DEFAULT_BILL_ID = "bill-123";

describe("useInterviewChat", () => {
  beforeEach(() => {
    mockSubmit.mockClear();
    mockState.onFinish = undefined;
    mockState.isLoading = false;
    mockState.returnedObject = undefined;
  });

  describe("初期状態", () => {
    it("初期メッセージなし: stageがchat・messagesが空・isLoadingがfalse・canRetryがfalse", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      expect(result.current.stage).toBe("chat");
      expect(result.current.messages).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.input).toBe("");
      expect(result.current.canRetry).toBe(false);
    });

    it("テキストのみの初期メッセージ: messagesに反映されstageがchat", () => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "assistant" as const,
          content: JSON.stringify({ text: "こんにちは" }),
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages })
      );

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe("こんにちは");
      expect(result.current.stage).toBe("chat");
    });

    it("レポート付き初期メッセージ: stageがsummaryになる", () => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "assistant" as const,
          content: JSON.stringify({
            text: "まとめました",
            report: {
              summary: "テスト要約",
              stance: "for",
              role: "general_citizen",
              role_description: "市民",
              role_title: "市民",
              opinions: [{ title: "意見1", content: "内容1" }],
            },
          }),
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages })
      );

      expect(result.current.stage).toBe("summary");
    });

    it("ユーザーメッセージの初期メッセージ: contentがそのまま反映される", () => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user" as const,
          content: "ユーザーの入力",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages })
      );

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("ユーザーの入力");
    });
  });

  describe("handleSubmit", () => {
    it("テキストが空: submitを呼ばずmessagesも変化しない", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "" });
      });

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(result.current.messages).toHaveLength(0);
    });

    it("テキストがundefined: submitを呼ばない", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: undefined });
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("ローディング中: submitを呼ばない", () => {
      mockState.isLoading = true;

      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト入力" });
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("有効なテキスト: ユーザーメッセージを追加しinputをクリアしsubmitを呼ぶ", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト入力" });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("テスト入力");
      expect(result.current.input).toBe("");
      expect(mockSubmit).toHaveBeenCalledOnce();
    });

    it("有効なテキスト: submitにbillIdとcurrentStage=chatが渡される", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト入力" });
      });

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          billId: DEFAULT_BILL_ID,
          currentStage: "chat",
        })
      );
    });

    it("有効なテキスト: submitのmessagesにユーザーメッセージが含まれる", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト入力" });
      });

      const calledWith = mockSubmit.mock.calls[0][0] as {
        messages: Array<{ role: string; content: string }>;
      };
      const userMsg = calledWith.messages.find((m) => m.role === "user");
      expect(userMsg?.content).toBe("テスト入力");
    });
  });

  describe("handleQuickReply", () => {
    it("クイックリプライ選択: handleSubmitが呼ばれユーザーメッセージが追加される", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleQuickReply("賛成");
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("賛成");
      expect(mockSubmit).toHaveBeenCalledOnce();
    });

    it("ローディング中のクイックリプライ: submitを呼ばない", () => {
      mockState.isLoading = true;

      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleQuickReply("賛成");
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe("onFinish コールバック", () => {
    it("成功レスポンス: assistantメッセージをmessagesに追加する", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      expect(result.current.messages).toHaveLength(1);

      act(() => {
        mockState.onFinish?.({
          object: { text: "AIの回答です", next_stage: "chat" },
          error: undefined,
        });
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe("assistant");
      expect(result.current.messages[1].content).toBe("AIの回答です");
    });

    it("next_stageがsummary: stageがsummaryに更新される", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      act(() => {
        mockState.onFinish?.({
          object: { text: "まとめます", next_stage: "summary" },
          error: undefined,
        });
      });

      expect(result.current.stage).toBe("summary");
    });

    it("next_stageがsummary_complete: stageがsummary_completeに更新される", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      act(() => {
        mockState.onFinish?.({
          object: { text: "完了しました", next_stage: "summary_complete" },
          error: undefined,
        });
      });

      expect(result.current.stage).toBe("summary_complete");
    });

    it("summary_complete後: handleSubmitがno-opになる", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      act(() => {
        mockState.onFinish?.({
          object: { text: "完了", next_stage: "summary_complete" },
          error: undefined,
        });
      });

      const callCountBefore = mockSubmit.mock.calls.length;

      act(() => {
        result.current.handleSubmit({ text: "もう一度送信" });
      });

      expect(mockSubmit.mock.calls.length).toBe(callCountBefore);
    });

    it("エラーレスポンス（1回目）: 自動リトライが実行される", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      const callCountBefore = mockSubmit.mock.calls.length;

      act(() => {
        mockState.onFinish?.({
          object: undefined,
          error: new Error("ネットワークエラー"),
        });
      });

      // 自動リトライでsubmitが再度呼ばれる
      expect(mockSubmit.mock.calls.length).toBeGreaterThan(callCountBefore);
    });

    it("エラーレスポンス（2回目）: displayErrorが設定されcanRetryがtrueになる", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      // 1回目のエラー（自動リトライ）
      act(() => {
        mockState.onFinish?.({
          object: undefined,
          error: new Error("エラー1"),
        });
      });

      // 2回目のエラー（手動リトライ待ち）
      act(() => {
        mockState.onFinish?.({
          object: undefined,
          error: new Error("エラー2"),
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.canRetry).toBe(true);
    });
  });

  describe("handleRetry", () => {
    it("canRetryがfalse: submitを呼ばない", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      expect(result.current.canRetry).toBe(false);

      act(() => {
        result.current.handleRetry();
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("canRetryがtrue: submitが呼ばれる", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      // エラーを2回発生させてcanRetry = trueにする
      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      act(() => {
        mockState.onFinish?.({
          object: undefined,
          error: new Error("エラー1"),
        });
      });

      act(() => {
        mockState.onFinish?.({
          object: undefined,
          error: new Error("エラー2"),
        });
      });

      expect(result.current.canRetry).toBe(true);

      mockSubmit.mockClear();

      act(() => {
        result.current.handleRetry();
      });

      expect(mockSubmit).toHaveBeenCalledOnce();
    });
  });

  describe("currentQuickReplies", () => {
    it("ローディング中: currentQuickRepliesが空配列", () => {
      mockState.isLoading = true;

      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      expect(result.current.currentQuickReplies).toEqual([]);
    });

    it("最後がユーザーメッセージ: currentQuickRepliesが空配列", () => {
      const { result } = renderHook(() =>
        useInterviewChat({ billId: DEFAULT_BILL_ID, initialMessages: [] })
      );

      act(() => {
        result.current.handleSubmit({ text: "テスト" });
      });

      // ユーザーメッセージが最後の状態
      expect(result.current.currentQuickReplies).toEqual([]);
    });
  });
});
