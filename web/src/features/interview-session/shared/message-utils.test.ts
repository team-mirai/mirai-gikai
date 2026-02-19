import { describe, expect, it } from "vitest";
import { isValidReport, parseMessageContent } from "./message-utils";

describe("isValidReport", () => {
  it("nullならfalseを返す", () => {
    expect(isValidReport(null)).toBe(false);
  });

  it("undefinedならfalseを返す", () => {
    expect(isValidReport(undefined)).toBe(false);
  });

  it("全フィールドがnull/空のレポートはfalseを返す", () => {
    expect(
      isValidReport({
        summary: null,
        stance: null,
        role: null,
        role_description: null,
        role_title: null,
        opinions: [],
      })
    ).toBe(false);
  });

  it("summaryがあればtrueを返す", () => {
    expect(
      isValidReport({
        summary: "テスト要約",
        stance: null,
        role: null,
        role_description: null,
        role_title: null,
        opinions: [],
      })
    ).toBe(true);
  });

  it("stanceがあればtrueを返す", () => {
    expect(
      isValidReport({
        summary: null,
        stance: "for",
        role: null,
        role_description: null,
        role_title: null,
        opinions: [],
      })
    ).toBe(true);
  });

  it("roleがあればtrueを返す", () => {
    expect(
      isValidReport({
        summary: null,
        stance: null,
        role: "subject_expert",
        role_description: null,
        role_title: null,
        opinions: [],
      })
    ).toBe(true);
  });

  it("role_descriptionがあればtrueを返す", () => {
    expect(
      isValidReport({
        summary: null,
        stance: null,
        role: null,
        role_description: "専門家として",
        role_title: null,
        opinions: [],
      })
    ).toBe(true);
  });

  it("role_titleがあればtrueを返す", () => {
    expect(
      isValidReport({
        summary: null,
        stance: null,
        role: null,
        role_description: null,
        role_title: "教師",
        opinions: [],
      })
    ).toBe(true);
  });

  it("opinionsがあればtrueを返す", () => {
    expect(
      isValidReport({
        summary: null,
        stance: null,
        role: null,
        role_description: null,
        role_title: null,
        opinions: [{ title: "意見1", content: "内容1" }],
      })
    ).toBe(true);
  });
});

describe("parseMessageContent", () => {
  it("有効なJSONメッセージをパースする", () => {
    const content = JSON.stringify({
      text: "こんにちは",
      question_id: "q1",
      quick_replies: ["はい", "いいえ"],
      topic_title: "経済政策",
    });
    const result = parseMessageContent(content);
    expect(result).toEqual({
      text: "こんにちは",
      report: null,
      quickReplies: ["はい", "いいえ"],
      questionId: "q1",
      topicTitle: "経済政策",
    });
  });

  it("JSONでない文字列はそのままテキストとして返す", () => {
    const result = parseMessageContent("普通のテキスト");
    expect(result).toEqual({
      text: "普通のテキスト",
      report: null,
      quickReplies: [],
      questionId: null,
      topicTitle: null,
    });
  });

  it("不正なJSONはフォールバックする", () => {
    const result = parseMessageContent("{invalid json}");
    expect(result).toEqual({
      text: "{invalid json}",
      report: null,
      quickReplies: [],
      questionId: null,
      topicTitle: null,
    });
  });

  it("textプロパティがないJSONオブジェクトはフォールバックする", () => {
    const content = JSON.stringify({ foo: "bar" });
    const result = parseMessageContent(content);
    expect(result).toEqual({
      text: content,
      report: null,
      quickReplies: [],
      questionId: null,
      topicTitle: null,
    });
  });

  it("reportがある場合にInterviewReportViewDataとして返す", () => {
    const content = JSON.stringify({
      text: "レポートです",
      report: {
        summary: "要約テスト",
        stance: "for",
        role: "general_citizen",
        role_description: "一般市民",
        role_title: "市民",
        opinions: [{ title: "意見", content: "内容" }],
      },
    });
    const result = parseMessageContent(content);
    expect(result.report).toEqual({
      summary: "要約テスト",
      stance: "for",
      role: "general_citizen",
      role_description: "一般市民",
      role_title: "市民",
      opinions: [{ title: "意見", content: "内容" }],
    });
    expect(result.text).toBe("レポートです");
  });

  it("reportのscoresフィールドは除外される", () => {
    const content = JSON.stringify({
      text: "テスト",
      report: {
        summary: "要約",
        stance: "neutral",
        role: null,
        role_description: null,
        role_title: null,
        opinions: [],
        scores: { total: 80, clarity: 70 },
      },
    });
    const result = parseMessageContent(content);
    expect(result.report).not.toBeNull();
    expect(result.report).not.toHaveProperty("scores");
  });

  it("reportが無効（全てnull/空）ならnullを返す", () => {
    const content = JSON.stringify({
      text: "テスト",
      report: {
        summary: null,
        stance: null,
        role: null,
        role_description: null,
        role_title: null,
        opinions: [],
      },
    });
    const result = parseMessageContent(content);
    expect(result.report).toBeNull();
  });

  it("reportのopinionsがnullの場合は空配列に変換される", () => {
    const content = JSON.stringify({
      text: "テスト",
      report: {
        summary: "要約あり",
        stance: null,
        role: null,
        role_description: null,
        role_title: null,
        opinions: null,
      },
    });
    const result = parseMessageContent(content);
    expect(result.report).not.toBeNull();
    expect(result.report?.opinions).toEqual([]);
  });

  it("questionIdフィールド（キャメルケース）も後方互換で対応する", () => {
    const content = JSON.stringify({
      text: "テスト",
      questionId: "q-camel",
    });
    const result = parseMessageContent(content);
    expect(result.questionId).toBe("q-camel");
  });

  it("question_idとquestionIdの両方がある場合はquestion_idを優先する", () => {
    const content = JSON.stringify({
      text: "テスト",
      question_id: "q-snake",
      questionId: "q-camel",
    });
    const result = parseMessageContent(content);
    expect(result.questionId).toBe("q-snake");
  });

  it("question_idがない場合はquick_repliesが空配列になる", () => {
    const content = JSON.stringify({
      text: "テスト",
      quick_replies: ["選択肢1", "選択肢2"],
    });
    const result = parseMessageContent(content);
    expect(result.quickReplies).toEqual([]);
    expect(result.questionId).toBeNull();
  });

  it("question_idがある場合のみquick_repliesが返される", () => {
    const content = JSON.stringify({
      text: "テスト",
      question_id: "q1",
      quick_replies: ["選択肢1", "選択肢2"],
    });
    const result = parseMessageContent(content);
    expect(result.quickReplies).toEqual(["選択肢1", "選択肢2"]);
  });

  it("textがnullの場合は空文字列を返す", () => {
    const content = JSON.stringify({
      text: null,
      question_id: "q1",
    });
    const result = parseMessageContent(content);
    expect(result.text).toBe("");
  });

  it("topic_titleが空文字の場合はnullを返す", () => {
    const content = JSON.stringify({
      text: "テスト",
      topic_title: "",
    });
    const result = parseMessageContent(content);
    expect(result.topicTitle).toBeNull();
  });
});
