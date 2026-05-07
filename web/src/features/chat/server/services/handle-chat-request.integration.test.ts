import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { LanguageModelUsage, UIMessage } from "ai";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
  createTestUser,
  cleanupTestUser,
  type TestUser,
} from "@test-utils/utils";
import { createStreamMock } from "@/test-utils/mock-language-model";
import { createMockPromptProvider } from "@/test-utils/mock-prompt-provider";
import {
  handleChatRequest,
  type ChatMessageMetadata,
} from "./handle-chat-request";
import { ChatError, ChatErrorCode } from "@/features/chat/shared/types/errors";
import { recordChatUsage } from "./cost-tracker";

/**
 * Response のボディストリームを全て読み込み、テキストとして返す。
 * onFinish コールバックを発火させるために必要。
 */
async function consumeResponseStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

/**
 * テスト用メッセージを作成するヘルパー
 */
function createTestMessages(
  overrides: Partial<ChatMessageMetadata> = {}
): UIMessage<ChatMessageMetadata>[] {
  return [
    {
      id: "test-msg-1",
      role: "user",
      parts: [{ type: "text", text: "テスト質問です" }],
      metadata: {
        difficultyLevel: "normal",
        sessionId: "",
        ...overrides,
      },
    },
  ];
}

describe("handleChatRequest 統合テスト", () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await adminClient
      .from("chat_usage_events")
      .delete()
      .eq("user_id", testUser.id);
    await cleanupTestUser(testUser.id);
  });

  describe("ストリーミングレスポンス", () => {
    it("mock model + mock promptProvider でストリーミングレスポンスが返る", async () => {
      const mockModel = createStreamMock([
        "こんにちは",
        "！",
        "テスト応答です。",
      ]);
      const mockPromptProvider = createMockPromptProvider();
      const messages = createTestMessages();

      const response = await handleChatRequest({
        messages,
        userId: testUser.id,
        deps: { model: mockModel, promptProvider: mockPromptProvider },
      });

      expect(response.status).toBe(200);
      const content = await consumeResponseStream(response);
      // AI SDK のストリーム形式でテキストが含まれている
      expect(content.length).toBeGreaterThan(0);
    });

    it("billContext を持つメッセージで bill-chat-system プロンプトが選択される", async () => {
      const promptProvider = createMockPromptProvider(
        "請求書チャット用システムプロンプト"
      );
      const receivedPromptNames: string[] = [];

      // getPrompt が呼ばれた際にプロンプト名を記録するカスタムプロバイダー
      const trackingPromptProvider = {
        getPrompt: async (name: string, variables?: Record<string, string>) => {
          receivedPromptNames.push(name);
          return promptProvider.getPrompt(name, variables);
        },
      };

      const mockModel = createStreamMock(["テスト応答"]);
      const messages = createTestMessages({
        pageContext: { type: "bill" },
        difficultyLevel: "normal",
      });

      const response = await handleChatRequest({
        messages,
        userId: testUser.id,
        deps: { model: mockModel, promptProvider: trackingPromptProvider },
      });

      await consumeResponseStream(response);

      expect(receivedPromptNames).toHaveLength(1);
      expect(receivedPromptNames[0]).toBe("bill-chat-system-normal");
    });

    it("公開済みbillでトグルONなら knowledgeSource がサーバー側で取得されてプロンプト変数に渡る", async () => {
      const bill = await createTestBill({ publish_status: "published" });
      await adminClient
        .from("bills")
        .update({
          knowledge_source: "補足ナレッジ本文",
          use_knowledge_source_in_chat: true,
        })
        .eq("id", bill.id);

      try {
        const receivedVariables: Array<Record<string, string> | undefined> = [];
        const trackingPromptProvider = {
          getPrompt: async (
            _name: string,
            variables?: Record<string, string>
          ) => {
            receivedVariables.push(variables);
            return { content: "テスト", metadata: "{}" };
          },
        };
        const mockModel = createStreamMock(["応答"]);
        const messages = createTestMessages({
          billContext: {
            id: bill.id,
            name: bill.name,
          } as unknown as ChatMessageMetadata["billContext"],
        });

        const response = await handleChatRequest({
          messages,
          userId: testUser.id,
          deps: { model: mockModel, promptProvider: trackingPromptProvider },
        });
        await consumeResponseStream(response);

        expect(receivedVariables[0]?.knowledgeSource).toBe("補足ナレッジ本文");
      } finally {
        await cleanupTestBill(bill.id);
      }
    });

    it("公開済みbillでトグルOFFなら knowledgeSource は空文字で渡る", async () => {
      const bill = await createTestBill({ publish_status: "published" });
      await adminClient
        .from("bills")
        .update({
          knowledge_source: "本文があってもOFFなら無視",
          use_knowledge_source_in_chat: false,
        })
        .eq("id", bill.id);

      try {
        const receivedVariables: Array<Record<string, string> | undefined> = [];
        const trackingPromptProvider = {
          getPrompt: async (
            _name: string,
            variables?: Record<string, string>
          ) => {
            receivedVariables.push(variables);
            return { content: "テスト", metadata: "{}" };
          },
        };
        const mockModel = createStreamMock(["応答"]);
        const messages = createTestMessages({
          billContext: {
            id: bill.id,
            name: bill.name,
          } as unknown as ChatMessageMetadata["billContext"],
        });

        const response = await handleChatRequest({
          messages,
          userId: testUser.id,
          deps: { model: mockModel, promptProvider: trackingPromptProvider },
        });
        await consumeResponseStream(response);

        expect(receivedVariables[0]?.knowledgeSource).toBe("");
      } finally {
        await cleanupTestBill(bill.id);
      }
    });

    it("クライアント側で bill 関連フィールドを偽装してもサーバー側のDB値が優先される", async () => {
      const bill = await createTestBill({ publish_status: "published" });
      await adminClient
        .from("bills")
        .update({
          knowledge_source: null,
          use_knowledge_source_in_chat: false,
        })
        .eq("id", bill.id);
      await adminClient.from("bill_contents").insert({
        bill_id: bill.id,
        difficulty_level: "normal",
        title: "サーバー側タイトル",
        summary: "サーバー側要約",
        content: "サーバー側本文",
      });

      try {
        const receivedVariables: Array<Record<string, string> | undefined> = [];
        const trackingPromptProvider = {
          getPrompt: async (
            _name: string,
            variables?: Record<string, string>
          ) => {
            receivedVariables.push(variables);
            return { content: "テスト", metadata: "{}" };
          },
        };
        const mockModel = createStreamMock(["応答"]);
        const messages = createTestMessages({
          billContext: {
            id: bill.id,
            name: "クライアント側で書き換えた名称",
            bill_content: {
              title: "クライアント側で書き換えたタイトル",
              summary: "クライアント側で書き換えた要約",
              content: "クライアント側で書き換えた本文",
            },
            knowledge_source: "クライアントから注入した秘密",
            use_knowledge_source_in_chat: true,
          } as unknown as ChatMessageMetadata["billContext"],
        });

        const response = await handleChatRequest({
          messages,
          userId: testUser.id,
          deps: { model: mockModel, promptProvider: trackingPromptProvider },
        });
        await consumeResponseStream(response);

        expect(receivedVariables[0]?.knowledgeSource).toBe("");
        expect(receivedVariables[0]?.billName).toBe(bill.name);
        expect(receivedVariables[0]?.billTitle).toBe("サーバー側タイトル");
        expect(receivedVariables[0]?.billSummary).toBe("サーバー側要約");
        expect(receivedVariables[0]?.billContent).toBe("サーバー側本文");
      } finally {
        await cleanupTestBill(bill.id);
      }
    });

    it("pageContext.type が home の場合は top-chat-system プロンプトが選択される", async () => {
      const receivedPromptNames: string[] = [];
      const trackingPromptProvider = {
        getPrompt: async (name: string) => {
          receivedPromptNames.push(name);
          return { content: "ホームチャット用プロンプト", metadata: "{}" };
        },
      };

      const mockModel = createStreamMock(["テスト応答"]);
      const messages = createTestMessages({
        pageContext: {
          type: "home",
          bills: [{ id: "bill-1", name: "テスト法案" }],
        },
      });

      const response = await handleChatRequest({
        messages,
        userId: testUser.id,
        deps: { model: mockModel, promptProvider: trackingPromptProvider },
      });

      await consumeResponseStream(response);

      expect(receivedPromptNames[0]).toBe("top-chat-system");
    });
  });

  describe("chat_usage_events の保存", () => {
    it("ストリーム完了後に chat_usage_events が DB に保存される", async () => {
      const sessionId = `test-session-${Date.now()}`;
      const mockModel = createStreamMock(["テスト応答"]);
      const mockPromptProvider = createMockPromptProvider();
      const messages = createTestMessages({ sessionId });

      const response = await handleChatRequest({
        messages,
        userId: testUser.id,
        deps: { model: mockModel, promptProvider: mockPromptProvider },
      });

      // ストリームを全て読み込んで onFinish を発火させる
      await consumeResponseStream(response);

      // onFinish は非同期のため少し待つ
      await new Promise((resolve) => setTimeout(resolve, 200));

      const { data: usageEvents } = await adminClient
        .from("chat_usage_events")
        .select("*")
        .eq("user_id", testUser.id);

      expect(usageEvents).toHaveLength(1);
      expect(usageEvents?.[0].user_id).toBe(testUser.id);
      expect(usageEvents?.[0].session_id).toBe(sessionId);
    });

    it("sessionId が空の場合は session_id が null として保存される", async () => {
      const mockModel = createStreamMock(["応答"]);
      const mockPromptProvider = createMockPromptProvider();
      const messages = createTestMessages({ sessionId: "" });

      const response = await handleChatRequest({
        messages,
        userId: testUser.id,
        deps: { model: mockModel, promptProvider: mockPromptProvider },
      });

      await consumeResponseStream(response);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const { data: usageEvents } = await adminClient
        .from("chat_usage_events")
        .select("session_id")
        .eq("user_id", testUser.id);

      expect(usageEvents).toHaveLength(1);
      expect(usageEvents?.[0].session_id).toBeNull();
    });
  });

  describe("コストリミット超過", () => {
    it("日次コストリミットを超過している場合は ChatError をスローする", async () => {
      // デイリーコストリミットを超える記録を事前にシード
      await recordChatUsage({
        userId: testUser.id,
        model: "openai/gpt-4o",
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        } as LanguageModelUsage,
        costUsd: 9999.99,
      });

      const mockModel = createStreamMock(["テスト"]);
      const mockPromptProvider = createMockPromptProvider();
      const messages = createTestMessages();

      await expect(
        handleChatRequest({
          messages,
          userId: testUser.id,
          deps: { model: mockModel, promptProvider: mockPromptProvider },
        })
      ).rejects.toThrow(ChatError);

      await expect(
        handleChatRequest({
          messages,
          userId: testUser.id,
          deps: { model: mockModel, promptProvider: mockPromptProvider },
        })
      ).rejects.toMatchObject({
        code: ChatErrorCode.DAILY_COST_LIMIT_REACHED,
      });
    });
  });
});
