import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  findInterviewMessagesBySessionIdDesc,
  updateInterviewSessionCompleted,
  upsertInterviewReport,
} from "../repositories/interview-session-repository";
import { completeInterviewSession } from "./complete-interview-session";
import { evaluateModerationScore } from "./evaluate-moderation-score";

vi.mock("server-only", () => ({}));

vi.mock("../repositories/interview-session-repository", () => ({
  findInterviewMessagesBySessionIdDesc: vi.fn(),
  updateInterviewSessionCompleted: vi.fn(),
  upsertInterviewReport: vi.fn(),
}));

vi.mock("./evaluate-moderation-score", () => ({
  evaluateModerationScore: vi.fn(),
}));

const findInterviewMessagesBySessionIdDescMock = vi.mocked(
  findInterviewMessagesBySessionIdDesc
);
const updateInterviewSessionCompletedMock = vi.mocked(
  updateInterviewSessionCompleted
);
const upsertInterviewReportMock = vi.mocked(upsertInterviewReport);
const evaluateModerationScoreMock = vi.mocked(evaluateModerationScore);

type MessageRow = Awaited<
  ReturnType<typeof findInterviewMessagesBySessionIdDesc>
>[number];
type ReportRow = Awaited<ReturnType<typeof upsertInterviewReport>>;

const reportMessage = JSON.stringify({
  text: "インタビューのまとめです。",
  report: {
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
  },
});

describe("completeInterviewSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findInterviewMessagesBySessionIdDescMock.mockResolvedValue([
      {
        id: "message-assistant-1",
        role: "assistant",
        content: reportMessage,
      },
      {
        id: "message-user-1",
        role: "user",
        content: "この法案に賛成です",
      },
    ] as MessageRow[]);
    evaluateModerationScoreMock.mockResolvedValue({
      score: 29,
      status: "ok",
      reasoning: "問題なし",
    });
    upsertInterviewReportMock.mockResolvedValue({
      id: "report-1",
      interview_session_id: "session-1",
    } as ReportRow);
  });

  it("ユーザー公開許可とスコア条件を満たすレポートを自動公開で保存する", async () => {
    const report = await completeInterviewSession({
      sessionId: "session-1",
      isPublicByUser: true,
    });

    expect(report.id).toBe("report-1");
    expect(upsertInterviewReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interview_session_id: "session-1",
        is_public_by_user: true,
        is_public_by_admin: true,
        moderation_score: 29,
        moderation_reasoning: "問題なし",
      })
    );
    expect(upsertInterviewReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        opinions: [
          expect.objectContaining({
            source_message_content: "この法案に賛成です",
          }),
        ],
      })
    );
    expect(updateInterviewSessionCompletedMock).toHaveBeenCalledWith(
      "session-1"
    );
  });

  it("ユーザー公開許可がない場合は管理者公開フラグを付与しない", async () => {
    await completeInterviewSession({
      sessionId: "session-1",
      isPublicByUser: false,
    });

    expect(upsertInterviewReportMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        is_public_by_admin: true,
      })
    );
    expect(upsertInterviewReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        is_public_by_user: false,
      })
    );
  });
});
