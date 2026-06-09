import { describe, expect, it } from "vitest";
import {
  buildInterviewTsv,
  type InterviewSessionForTsv,
} from "./build-interview-tsv";

function buildSession(
  overrides: Partial<InterviewSessionForTsv> = {}
): InterviewSessionForTsv {
  return {
    id: "session-1",
    interview_config_id: "config-1",
    user_id: "user-1",
    started_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-01T00:10:00Z",
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:10:00Z",
    langfuse_session_id: null,
    rating: null,
    interview_report: null,
    interview_messages: [],
    ...overrides,
  };
}

describe("buildInterviewTsv", () => {
  it("ヘッダー行を含み、全カラムをタブ区切りで出力する", () => {
    const tsv = buildInterviewTsv([]);
    expect(tsv.split("\n")[0]).toBe(
      [
        "session_id",
        "user_id",
        "started_at",
        "completed_at",
        "archived_at",
        "stance",
        "role",
        "role_title",
        "moderation_score",
        "moderation_status",
        "total_content_richness",
        "is_public_by_user",
        "is_public_by_admin",
        "summary",
        "message_order",
        "message_role",
        "message_content",
        "message_created_at",
      ].join("\t")
    );
  });

  it("1セッション = N行(メッセージ数ぶん)に展開され、セッション情報が冗長コピーされる", () => {
    const tsv = buildInterviewTsv([
      buildSession({
        interview_messages: [
          {
            id: "m1",
            interview_session_id: "session-1",
            role: "assistant",
            content: "質問1",
            created_at: "2026-01-01T00:01:00Z",
          },
          {
            id: "m2",
            interview_session_id: "session-1",
            role: "user",
            content: "回答1",
            created_at: "2026-01-01T00:02:00Z",
          },
        ],
      }),
    ]);
    const rows = tsv.split("\n");
    expect(rows).toHaveLength(3);
    const cellsRow1 = rows[1].split("\t");
    const cellsRow2 = rows[2].split("\t");
    expect(cellsRow1[0]).toBe("session-1");
    expect(cellsRow2[0]).toBe("session-1");
    expect(cellsRow1[14]).toBe("1");
    expect(cellsRow1[15]).toBe("assistant");
    expect(cellsRow1[16]).toBe("質問1");
    expect(cellsRow2[14]).toBe("2");
    expect(cellsRow2[15]).toBe("user");
    expect(cellsRow2[16]).toBe("回答1");
  });

  it("セッション情報(stance/score/summary 等)が各行に重複コピーされる", () => {
    const tsv = buildInterviewTsv([
      buildSession({
        interview_report: {
          id: "r1",
          interview_session_id: "session-1",
          stance: "for",
          role: "subject_expert",
          role_title: "教育研究者",
          role_description: null,
          moderation_score: 12,
          moderation_status: "ok",
          moderation_reasoning: null,
          content_richness: null,
          total_content_richness: 75,
          opinions: null,
          summary: "賛成意見",
          is_public_by_user: true,
          is_public_by_admin: false,
          opinions_reextracted_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:10:00Z",
        },
        interview_messages: [
          {
            id: "m1",
            interview_session_id: "session-1",
            role: "user",
            content: "意見",
            created_at: "2026-01-01T00:01:00Z",
          },
        ],
      }),
    ]);
    const cells = tsv.split("\n")[1].split("\t");
    expect(cells[5]).toBe("for");
    expect(cells[6]).toBe("subject_expert");
    expect(cells[7]).toBe("教育研究者");
    expect(cells[8]).toBe("12");
    expect(cells[9]).toBe("ok");
    expect(cells[10]).toBe("75");
    expect(cells[11]).toBe("true");
    expect(cells[12]).toBe("false");
    expect(cells[13]).toBe("賛成意見");
  });

  it("改行・タブを半角スペースに置換してTSVの区切りを壊さない", () => {
    const tsv = buildInterviewTsv([
      buildSession({
        interview_messages: [
          {
            id: "m1",
            interview_session_id: "session-1",
            role: "user",
            content: "改行\nあり\tタブも",
            created_at: "2026-01-01T00:01:00Z",
          },
        ],
      }),
    ]);
    const cells = tsv.split("\n")[1].split("\t");
    expect(cells).toHaveLength(18);
    expect(cells[16]).toBe("改行 あり タブも");
  });

  it("メッセージが0件のセッションも1行として出力される", () => {
    const tsv = buildInterviewTsv([buildSession({ interview_messages: [] })]);
    const rows = tsv.split("\n");
    expect(rows).toHaveLength(2);
    const cells = rows[1].split("\t");
    expect(cells[0]).toBe("session-1");
    expect(cells[14]).toBe("");
    expect(cells[15]).toBe("");
    expect(cells[16]).toBe("");
    expect(cells[17]).toBe("");
  });

  it("null/undefined のセッション情報は空文字として出力される", () => {
    const tsv = buildInterviewTsv([
      buildSession({
        completed_at: null,
        interview_report: null,
        interview_messages: [
          {
            id: "m1",
            interview_session_id: "session-1",
            role: "user",
            content: "x",
            created_at: "2026-01-01T00:01:00Z",
          },
        ],
      }),
    ]);
    const cells = tsv.split("\n")[1].split("\t");
    expect(cells[3]).toBe("");
    expect(cells[5]).toBe("");
    expect(cells[13]).toBe("");
  });

  it("先頭が = + - @ の値は ' を前置して数式評価を防ぐ", () => {
    const tsv = buildInterviewTsv([
      buildSession({
        interview_report: {
          id: "r1",
          interview_session_id: "session-1",
          stance: null,
          role: null,
          role_title: null,
          role_description: null,
          moderation_score: null,
          moderation_status: null,
          moderation_reasoning: null,
          content_richness: null,
          total_content_richness: null,
          opinions: null,
          summary: "=SUM(A1:A2)",
          is_public_by_user: false,
          is_public_by_admin: false,
          opinions_reextracted_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:10:00Z",
        },
        interview_messages: [
          {
            id: "m1",
            interview_session_id: "session-1",
            role: "user",
            content: "=1+1",
            created_at: "2026-01-01T00:01:00Z",
          },
          {
            id: "m2",
            interview_session_id: "session-1",
            role: "user",
            content: "@cmd",
            created_at: "2026-01-01T00:02:00Z",
          },
          {
            id: "m3",
            interview_session_id: "session-1",
            role: "user",
            content: "-1",
            created_at: "2026-01-01T00:03:00Z",
          },
          {
            id: "m4",
            interview_session_id: "session-1",
            role: "user",
            content: "+SUM",
            created_at: "2026-01-01T00:04:00Z",
          },
        ],
      }),
    ]);
    const rows = tsv.split("\n");
    expect(rows[1].split("\t")[13]).toBe("'=SUM(A1:A2)");
    expect(rows[1].split("\t")[16]).toBe("'=1+1");
    expect(rows[2].split("\t")[16]).toBe("'@cmd");
    expect(rows[3].split("\t")[16]).toBe("'-1");
    expect(rows[4].split("\t")[16]).toBe("'+SUM");
  });
});
