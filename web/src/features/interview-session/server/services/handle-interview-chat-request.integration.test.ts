import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import { createStreamMock } from "@/test-utils/mock-language-model";
import type { InterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { findInterviewMessagesBySessionId } from "../repositories/interview-session-repository";
import { handleInterviewChatRequest } from "./handle-interview-chat-request";
import type { InterviewSession } from "../../shared/types";

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
    scores: {
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
