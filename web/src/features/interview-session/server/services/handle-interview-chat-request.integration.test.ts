import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestInterviewData,
  createTestUser,
  type TestUser,
} from "@test-utils/utils";
import { convertArrayToReadableStream, MockLanguageModelV3 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { InterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { createStreamMock } from "@/test-utils/mock-language-model";
import type { InterviewSession } from "../../shared/types";
import { findInterviewMessagesBySessionId } from "../repositories/interview-session-repository";
import { handleInterviewChatRequest } from "./handle-interview-chat-request";

type CapturedPrompt = Array<{ role: string; content?: unknown }>;

/**
 * モデルが受け取った prompt（変換後のメッセージ列）を記録する streamText 用モック。
 * 末尾が user メッセージで終わっているか・履歴が二重送信されていないかの検証に使う。
 */
function createCapturingStreamMock(text: string): {
  model: MockLanguageModelV3;
  prompts: CapturedPrompt[];
} {
  const prompts: CapturedPrompt[] = [];
  const model = new MockLanguageModelV3({
    doStream: async (options) => {
      prompts.push(options.prompt as CapturedPrompt);
      return {
        stream: convertArrayToReadableStream([
          { type: "stream-start" as const, warnings: [] as [] },
          { type: "text-start" as const, id: "text-1" },
          { type: "text-delta" as const, id: "text-1", delta: text },
          { type: "text-end" as const, id: "text-1" },
          {
            type: "finish" as const,
            usage: {
              inputTokens: {
                total: 0,
                noCache: 0,
                cacheRead: 0,
                cacheWrite: 0,
              },
              outputTokens: { total: 0, text: 0, reasoning: 0 },
            },
            finishReason: { unified: "stop" as const, raw: undefined },
          },
        ]),
      };
    },
  });
  return { model, prompts };
}

/**
 * Response のボディストリームを全て読み込む。
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

// interviewChatTextSchema に準拠したモックレスポンス
const validChatResponse = JSON.stringify({
  text: "法案についてのご意見をお聞かせください。",
  quick_replies: ["賛成です", "反対です"],
  question_id: null,
  topic_title: null,
  next_stage: "chat",
});

// interviewChatWithReportSchema に準拠したモックレスポンス
const validSummaryResponse = JSON.stringify({
  text: "インタビューのまとめです。ご協力ありがとうございました。",
  report: {
    summary: "テスト法案に賛成の立場",
    stance: "for",
    role: "general_citizen",
    role_description: "一般市民として法案に関心がある",
    role_title: "会社員",
    opinions: [
      {
        title: "賛成の理由",
        content: "社会全体の利益になると考える",
      },
    ],
    content_richness: {
      total: 70,
      clarity: 80,
      specificity: 60,
      impact: 70,
      constructiveness: 65,
      reasoning: "明確な意見表明があり、具体的な理由も述べられている",
    },
  },
  next_stage: "summary_complete",
});

describe("handleInterviewChatRequest 統合テスト", () => {
  let testUser: TestUser;
  let sessionId: string;
  let billId: string;
  let session: InterviewSession;
  let config: InterviewConfig;

  beforeEach(async () => {
    testUser = await createTestUser();
    const data = await createTestInterviewData(testUser.id);
    sessionId = data.session.id;
    billId = data.bill.id;
    session = data.session;
    config = data.config;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  describe("chatフェーズ", () => {
    it("ユーザーメッセージとassistantメッセージがDBに保存される", async () => {
      const mockModel = createStreamMock([validChatResponse]);

      const response = await handleInterviewChatRequest({
        messages: [
          { role: "user", content: "この法案についてどう思いますか？" },
        ],
        billId,
        currentStage: "chat",
        userId: testUser.id,
        deps: {
          chatModel: mockModel,
          getBill: async () => null,
          getInterviewConfig: async () => config,
          getSession: async () => session,
          getMessages: async () => [],
        },
      });

      expect(response.status).toBe(200);
      await consumeResponseStream(response);

      // onFinish は非同期のため少し待つ
      await new Promise((resolve) => setTimeout(resolve, 300));

      const messages = await findInterviewMessagesBySessionId(sessionId);

      // user: 1件 + assistant: 1件
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("この法案についてどう思いますか？");
      expect(messages[1].role).toBe("assistant");
      expect(messages[1].content).toBe(validChatResponse);
    });

    it("空白のみのユーザーメッセージはDBに保存されない", async () => {
      const mockModel = createStreamMock([validChatResponse]);

      const response = await handleInterviewChatRequest({
        messages: [{ role: "user", content: "   " }],
        billId,
        currentStage: "chat",
        userId: testUser.id,
        deps: {
          chatModel: mockModel,
          getBill: async () => null,
          getInterviewConfig: async () => config,
          getSession: async () => session,
          getMessages: async () => [],
        },
      });

      expect(response.status).toBe(200);
      await consumeResponseStream(response);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const messages = await findInterviewMessagesBySessionId(sessionId);

      // assistant のみ保存される（空白のuserメッセージはスキップ）
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("assistant");
    });

    it("リトライ時はユーザーメッセージが重複して保存されない", async () => {
      // 事前にユーザーメッセージを保存しておく（リトライ前の元のメッセージ）
      await adminClient.from("interview_messages").insert({
        interview_session_id: sessionId,
        role: "user",
        content: "この法案についてどう思いますか？",
      });

      const mockModel = createStreamMock([validChatResponse]);

      const response = await handleInterviewChatRequest({
        messages: [
          { role: "user", content: "この法案についてどう思いますか？" },
        ],
        billId,
        currentStage: "chat",
        isRetry: true,
        userId: testUser.id,
        deps: {
          chatModel: mockModel,
          getBill: async () => null,
          getInterviewConfig: async () => config,
          getSession: async () => session,
          getMessages: async () => [],
        },
      });

      await consumeResponseStream(response);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const messages = await findInterviewMessagesBySessionId(sessionId);

      // user: 1件（重複なし）+ assistant: 1件 = 2件
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("user");
      expect(messages[1].role).toBe("assistant");
    });
  });

  describe("summaryフェーズ", () => {
    it("ユーザーメッセージとassistantメッセージがDBに保存される", async () => {
      const mockModel = createStreamMock([validSummaryResponse]);

      const response = await handleInterviewChatRequest({
        messages: [{ role: "user", content: "まとめてください" }],
        billId,
        currentStage: "summary",
        userId: testUser.id,
        deps: {
          summaryModel: mockModel,
          getBill: async () => null,
          getInterviewConfig: async () => config,
          getSession: async () => session,
          getMessages: async () => [],
        },
      });

      expect(response.status).toBe(200);
      await consumeResponseStream(response);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const messages = await findInterviewMessagesBySessionId(sessionId);

      // user: 1件 + assistant: 1件
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("まとめてください");
      expect(messages[1].role).toBe("assistant");
      expect(messages[1].content).toBe(validSummaryResponse);
    });

    it("chat→summary 自動遷移（末尾が assistant）でもモデルへは user メッセージで終わる列を渡す", async () => {
      // クライアントの自動サマリーリクエストを再現：新しい user メッセージなしで
      // 末尾が assistant のメッセージ列を送る。Anthropic 系は user で終わる必要がある。
      const { model, prompts } =
        createCapturingStreamMock(validSummaryResponse);

      const response = await handleInterviewChatRequest({
        messages: [
          { role: "user", content: "賛成です" },
          { role: "assistant", content: "最後の質問です。他にありますか？" },
        ],
        billId,
        currentStage: "summary",
        userId: testUser.id,
        deps: {
          summaryModel: model,
          getBill: async () => null,
          getInterviewConfig: async () => config,
          getSession: async () => session,
          getMessages: async () => [],
        },
      });

      expect(response.status).toBe(200);
      await consumeResponseStream(response);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // モデルに渡された prompt の末尾が user メッセージであること
      expect(prompts).toHaveLength(1);
      expect(prompts[0].at(-1)?.role).toBe("user");

      // 会話履歴はシステムプロンプトに含まれるため、メッセージ列には
      // 合成 user メッセージ1件のみを渡す（履歴の二重送信を防ぐ）
      const nonSystemMessages = prompts[0].filter((m) => m.role !== "system");
      expect(nonSystemMessages).toHaveLength(1);

      // 補った user メッセージは DB に保存されない（assistant の出力のみ保存）
      const messages = await findInterviewMessagesBySessionId(sessionId);
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].content).toBe(validSummaryResponse);
    });

    it("レポート修正依頼（末尾が user）では末尾の user メッセージのみをモデルへ渡す", async () => {
      const { model, prompts } =
        createCapturingStreamMock(validSummaryResponse);

      const response = await handleInterviewChatRequest({
        messages: [
          { role: "user", content: "賛成です" },
          { role: "assistant", content: "レポート案です" },
          { role: "user", content: "もっと簡潔にしてください" },
        ],
        billId,
        currentStage: "summary",
        userId: testUser.id,
        deps: {
          summaryModel: model,
          getBill: async () => null,
          getInterviewConfig: async () => config,
          getSession: async () => session,
          getMessages: async () => [],
        },
      });

      expect(response.status).toBe(200);
      await consumeResponseStream(response);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 履歴はシステムプロンプト側にあるため、メッセージ列は末尾の user 1件のみ
      expect(prompts).toHaveLength(1);
      const nonSystemMessages = prompts[0].filter((m) => m.role !== "system");
      expect(nonSystemMessages).toHaveLength(1);
      expect(nonSystemMessages[0].role).toBe("user");
      expect(JSON.stringify(nonSystemMessages[0].content)).toContain(
        "もっと簡潔にしてください"
      );

      // 会話履歴（修正依頼を含む）はシステムプロンプトに含まれること
      const systemMessage = prompts[0].find((m) => m.role === "system");
      expect(JSON.stringify(systemMessage?.content)).toContain("賛成です");
      expect(JSON.stringify(systemMessage?.content)).toContain(
        "もっと簡潔にしてください"
      );

      // 修正依頼の user メッセージと assistant の出力が DB に保存されること
      const messages = await findInterviewMessagesBySessionId(sessionId);
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("もっと簡潔にしてください");
      expect(messages[1].role).toBe("assistant");
    });

    it("summaryフェーズではsummaryModelが使用される（chatModelは無視される）", async () => {
      const summaryMock = createStreamMock([validSummaryResponse]);
      // chatModel は summary フェーズでは使用されないはずだが注入する
      const chatMock = createStreamMock([
        '{"text":"これは呼ばれてはいけない"}',
      ]);

      const response = await handleInterviewChatRequest({
        messages: [{ role: "user", content: "まとめてください" }],
        billId,
        currentStage: "summary",
        userId: testUser.id,
        deps: {
          summaryModel: summaryMock,
          chatModel: chatMock,
          getBill: async () => null,
          getInterviewConfig: async () => config,
          getSession: async () => session,
          getMessages: async () => [],
        },
      });

      await consumeResponseStream(response);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const messages = await findInterviewMessagesBySessionId(sessionId);

      // summaryModel の出力が保存されていること
      expect(messages).toHaveLength(2);
      expect(messages[1].content).toBe(validSummaryResponse);
    });
  });
});
