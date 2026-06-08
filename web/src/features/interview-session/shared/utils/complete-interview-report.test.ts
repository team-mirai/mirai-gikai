import { describe, expect, it } from "vitest";
import type { InterviewReportData } from "../schemas";
import { buildCompletedInterviewReportInsert } from "./complete-interview-report";

const reportData = {
  summary: "賛成の立場",
  stance: "for",
  role: "general_citizen",
  role_description: "一般市民として関心がある",
  role_title: "会社員",
  opinions: [
    {
      title: "賛成の理由",
      content: "社会全体の利益になる",
      source_message_id: "message-user-1",
      contextual_quote: null,
      bill_sentiment: null,
    },
  ],
  content_richness: {
    total: 70,
    clarity: 80,
    specificity: 60,
    impact: 70,
    constructiveness: 65,
    reasoning: "具体的な理由がある",
  },
} satisfies InterviewReportData;

describe("buildCompletedInterviewReportInsert", () => {
  it("ユーザー公開許可とスコア条件を満たすレポートに管理者公開フラグを付与する", () => {
    const insert = buildCompletedInterviewReportInsert({
      sessionId: "session-1",
      messages: [
        {
          id: "message-assistant-1",
          role: "assistant",
          content: JSON.stringify({ report: reportData }),
        },
        {
          id: "message-user-1",
          role: "user",
          content: "この法案に賛成です",
        },
      ],
      reportData,
      moderationScore: 29,
      moderationReasoning: "問題なし",
      isPublicByUser: true,
    });

    expect(insert).toEqual(
      expect.objectContaining({
        interview_session_id: "session-1",
        is_public_by_user: true,
        is_public_by_admin: true,
        moderation_score: 29,
        moderation_reasoning: "問題なし",
      })
    );
    expect(insert.opinions).toEqual([
      expect.objectContaining({
        source_message_content: "この法案に賛成です",
      }),
    ]);
  });

  it("根拠IDがユーザーメッセージに解決できない場合は根拠をnullへ正規化する", () => {
    const insert = buildCompletedInterviewReportInsert({
      sessionId: "session-1",
      messages: [
        {
          id: "message-user-1",
          role: "assistant",
          content: "assistantの本文",
        },
      ],
      reportData,
      moderationScore: 29,
      moderationReasoning: "問題なし",
      isPublicByUser: true,
    });

    expect(insert.opinions).toEqual([
      expect.objectContaining({
        source_message_id: null,
        source_message_content: null,
      }),
    ]);
  });

  it("ユーザー公開許可がない場合は管理者公開フラグを付与しない", () => {
    const insert = buildCompletedInterviewReportInsert({
      sessionId: "session-1",
      messages: [],
      reportData,
      moderationScore: 29,
      moderationReasoning: "問題なし",
      isPublicByUser: false,
    });

    expect(insert).toEqual(
      expect.objectContaining({
        is_public_by_user: false,
      })
    );
    expect(insert).not.toHaveProperty("is_public_by_admin");
  });

  it("公開設定未指定と根拠メッセージなしの意見を保存用payloadへ反映する", () => {
    const insert = buildCompletedInterviewReportInsert({
      sessionId: "session-1",
      messages: [],
      reportData: {
        ...reportData,
        opinions: [
          {
            title: "根拠なし",
            content: "全体として賛成",
            source_message_id: null,
            contextual_quote: null,
            bill_sentiment: null,
          },
        ],
      },
      moderationScore: null,
      moderationReasoning: null,
    });

    expect(insert).not.toHaveProperty("is_public_by_user");
    expect(insert).not.toHaveProperty("is_public_by_admin");
    expect(insert.opinions).toEqual([
      expect.objectContaining({
        source_message_content: null,
      }),
    ]);
  });
});
