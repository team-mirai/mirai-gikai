import { describe, expect, it } from "vitest";
import { buildPublicRespondentDetail } from "./build-public-respondent-detail";
import type {
  RawRespondentDetailRow,
  RawTranscriptMessageRow,
} from "./public-types";

const baseReport: RawRespondentDetailRow = {
  id: "report-1",
  role: "work_related",
  role_title: "運送業の経営者",
  stance: "against",
  summary: "要約テキスト",
  role_description: "運送会社を経営しています",
  created_at: "2026-06-01T00:00:00Z",
};

describe("buildPublicRespondentDetail", () => {
  it("role→カテゴリ・stance→懸念に正規化し、role_description と会話ログを返す", () => {
    const messages: RawTranscriptMessageRow[] = [
      {
        id: "m1",
        role: "assistant",
        content: "この法案についてどう思いますか？",
        created_at: "2026-06-01T00:00:01Z",
      },
      {
        id: "m2",
        role: "user",
        content: "燃料費が下がるのはありがたいです",
        created_at: "2026-06-01T00:00:02Z",
      },
    ];

    const result = buildPublicRespondentDetail(baseReport, messages);

    expect(result.id).toBe("report-1");
    expect(result.user_category).toBe("industry");
    expect(result.role_title).toBe("運送業の経営者");
    expect(result.role_description).toBe("運送会社を経営しています");
    expect(result.bill_sentiment).toBe("懸念");
    expect(result.messages).toEqual([
      {
        id: "m1",
        speaker: "assistant",
        content: "この法案についてどう思いますか？",
        created_at: "2026-06-01T00:00:01Z",
      },
      {
        id: "m2",
        speaker: "user",
        content: "燃料費が下がるのはありがたいです",
        created_at: "2026-06-01T00:00:02Z",
      },
    ]);
  });

  it("assistant/user 以外のメッセージ（system 等）は会話ログから除外する", () => {
    const messages: RawTranscriptMessageRow[] = [
      { id: "s1", role: "system", content: "システム指示", created_at: null },
      { id: "u1", role: "user", content: "回答", created_at: null },
    ];

    const result = buildPublicRespondentDetail(baseReport, messages);

    expect(result.messages.map((m) => m.id)).toEqual(["u1"]);
  });

  it("会話ログが空でも詳細を返す", () => {
    const result = buildPublicRespondentDetail(baseReport, []);
    expect(result.messages).toEqual([]);
  });
});
