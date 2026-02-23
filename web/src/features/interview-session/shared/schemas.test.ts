import { describe, expect, it } from "vitest";
import {
  interviewChatResponseSchema,
  interviewChatTextSchema,
  interviewChatWithReportSchema,
  interviewReportSchema,
  interviewStageSchema,
} from "./schemas";

// テスト用の有効なscoresデータ
const validScores = {
  total: 80,
  clarity: 70,
  specificity: 60,
  impact: 50,
  constructiveness: 40,
  reasoning: "テストの根拠",
};

// テスト用の有効なreportデータ
const validReport = {
  summary: "テストのサマリー",
  stance: "for" as const,
  role: "subject_expert" as const,
  role_description: "テストの役割説明",
  role_title: "研究者",
  opinions: [{ title: "テスト意見", content: "テスト内容" }],
  scores: validScores,
};

describe("scoreValueSchema (via interviewReportSchema)", () => {
  it("正常な整数値をそのまま受け入れる", () => {
    const result = interviewReportSchema.parse(validReport);
    expect(result.scores.total).toBe(80);
  });

  it("小数を四捨五入する (50.7 → 51)", () => {
    const result = interviewReportSchema.parse({
      ...validReport,
      scores: { ...validScores, total: 50.7 },
    });
    expect(result.scores.total).toBe(51);
  });

  it("小数を四捨五入する (50.3 → 50)", () => {
    const result = interviewReportSchema.parse({
      ...validReport,
      scores: { ...validScores, total: 50.3 },
    });
    expect(result.scores.total).toBe(50);
  });

  it("境界値 0 を受け入れる", () => {
    const result = interviewReportSchema.parse({
      ...validReport,
      scores: { ...validScores, total: 0 },
    });
    expect(result.scores.total).toBe(0);
  });

  it("境界値 100 を受け入れる", () => {
    const result = interviewReportSchema.parse({
      ...validReport,
      scores: { ...validScores, total: 100 },
    });
    expect(result.scores.total).toBe(100);
  });

  it("範囲外の値 -1 を拒否する", () => {
    const result = interviewReportSchema.safeParse({
      ...validReport,
      scores: { ...validScores, total: -1 },
    });
    expect(result.success).toBe(false);
  });

  it("範囲外の値 101 を拒否する", () => {
    const result = interviewReportSchema.safeParse({
      ...validReport,
      scores: { ...validScores, total: 101 },
    });
    expect(result.success).toBe(false);
  });

  it("非数値を拒否する", () => {
    const result = interviewReportSchema.safeParse({
      ...validReport,
      scores: { ...validScores, total: "fifty" },
    });
    expect(result.success).toBe(false);
  });

  it("全スコアフィールドで小数が丸められる", () => {
    const result = interviewReportSchema.parse({
      ...validReport,
      scores: {
        total: 80.6,
        clarity: 70.4,
        specificity: 60.5,
        impact: 50.1,
        constructiveness: 40.9,
        reasoning: "テスト",
      },
    });
    expect(result.scores.total).toBe(81);
    expect(result.scores.clarity).toBe(70);
    expect(result.scores.specificity).toBe(61);
    expect(result.scores.impact).toBe(50);
    expect(result.scores.constructiveness).toBe(41);
  });
});

describe("interviewReportSchema", () => {
  it("正常な完全データをパースできる", () => {
    const result = interviewReportSchema.parse(validReport);
    expect(result).toEqual(validReport);
  });

  it("strictモードで余計なフィールドを拒否する", () => {
    const result = interviewReportSchema.safeParse({
      ...validReport,
      extraField: "不正",
    });
    expect(result.success).toBe(false);
  });

  describe("null許容フィールド", () => {
    it("summary に null を許容する", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        summary: null,
      });
      expect(result.summary).toBeNull();
    });

    it("stance に null を許容する", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        stance: null,
      });
      expect(result.stance).toBeNull();
    });

    it("role に null を許容する", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        role: null,
      });
      expect(result.role).toBeNull();
    });

    it("role_description に null を許容する", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        role_description: null,
      });
      expect(result.role_description).toBeNull();
    });

    it("role_title に null を許容する", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        role_title: null,
      });
      expect(result.role_title).toBeNull();
    });
  });

  describe("stance enum", () => {
    it.each(["for", "against", "neutral"])("%s を受け入れる", (value) => {
      const result = interviewReportSchema.parse({
        ...validReport,
        stance: value,
      });
      expect(result.stance).toBe(value);
    });

    it("無効な値を拒否する", () => {
      const result = interviewReportSchema.safeParse({
        ...validReport,
        stance: "other",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("role enum", () => {
    it.each([
      "subject_expert",
      "work_related",
      "daily_life_affected",
      "general_citizen",
    ])("%s を受け入れる", (value) => {
      const result = interviewReportSchema.parse({
        ...validReport,
        role: value,
      });
      expect(result.role).toBe(value);
    });

    it("無効な値を拒否する", () => {
      const result = interviewReportSchema.safeParse({
        ...validReport,
        role: "unknown",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("role_title", () => {
    it("10文字以内を受け入れる", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        role_title: "1234567890",
      });
      expect(result.role_title).toBe("1234567890");
    });

    it("10文字超を拒否する", () => {
      const result = interviewReportSchema.safeParse({
        ...validReport,
        role_title: "12345678901",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("opinions", () => {
    it("3件まで受け入れる", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        opinions: [
          { title: "意見1", content: "内容1" },
          { title: "意見2", content: "内容2" },
          { title: "意見3", content: "内容3" },
        ],
      });
      expect(result.opinions).toHaveLength(3);
    });

    it("4件以上を拒否する", () => {
      const result = interviewReportSchema.safeParse({
        ...validReport,
        opinions: [
          { title: "意見1", content: "内容1" },
          { title: "意見2", content: "内容2" },
          { title: "意見3", content: "内容3" },
          { title: "意見4", content: "内容4" },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("空配列を受け入れる", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        opinions: [],
      });
      expect(result.opinions).toHaveLength(0);
    });

    it("titleが欠けている場合を拒否する", () => {
      const result = interviewReportSchema.safeParse({
        ...validReport,
        opinions: [{ content: "内容のみ" }],
      });
      expect(result.success).toBe(false);
    });

    it("contentが欠けている場合を拒否する", () => {
      const result = interviewReportSchema.safeParse({
        ...validReport,
        opinions: [{ title: "タイトルのみ" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("scores内のスコアに小数が入った場合", () => {
    it("全フィールドが丸められてパースされる", () => {
      const result = interviewReportSchema.parse({
        ...validReport,
        scores: {
          total: 85.4,
          clarity: 72.6,
          specificity: 65.5,
          impact: 55.1,
          constructiveness: 45.9,
          reasoning: "小数テスト",
        },
      });
      expect(result.scores.total).toBe(85);
      expect(result.scores.clarity).toBe(73);
      expect(result.scores.specificity).toBe(66);
      expect(result.scores.impact).toBe(55);
      expect(result.scores.constructiveness).toBe(46);
      expect(result.scores.reasoning).toBe("小数テスト");
    });
  });

  it("必須フィールドが欠けている場合を拒否する", () => {
    const result = interviewReportSchema.safeParse({
      summary: "テスト",
    });
    expect(result.success).toBe(false);
  });
});

describe("interviewStageSchema", () => {
  it.each([
    "chat",
    "summary",
    "summary_complete",
  ])("%s を受け入れる", (value) => {
    const result = interviewStageSchema.parse(value);
    expect(result).toBe(value);
  });

  it("無効な値を拒否する", () => {
    const result = interviewStageSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });

  it("空文字列を拒否する", () => {
    const result = interviewStageSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("interviewChatTextSchema", () => {
  it("正常なデータをパースできる", () => {
    const data = {
      text: "こんにちは",
      quick_replies: ["はい", "いいえ"],
      question_id: "q1",
      topic_title: "トピック",
    };
    const result = interviewChatTextSchema.parse(data);
    expect(result).toEqual(data);
  });

  it("quick_replies に null を許容する", () => {
    const result = interviewChatTextSchema.parse({
      text: "テスト",
      quick_replies: null,
      question_id: "q1",
      topic_title: "トピック",
    });
    expect(result.quick_replies).toBeNull();
  });

  it("question_id に null を許容する", () => {
    const result = interviewChatTextSchema.parse({
      text: "テスト",
      quick_replies: [],
      question_id: null,
      topic_title: "トピック",
    });
    expect(result.question_id).toBeNull();
  });

  it("topic_title に null を許容する", () => {
    const result = interviewChatTextSchema.parse({
      text: "テスト",
      quick_replies: [],
      question_id: "q1",
      topic_title: null,
    });
    expect(result.topic_title).toBeNull();
  });

  it("text が欠けている場合を拒否する", () => {
    const result = interviewChatTextSchema.safeParse({
      quick_replies: [],
      question_id: "q1",
      topic_title: "トピック",
    });
    expect(result.success).toBe(false);
  });
});

describe("interviewChatWithReportSchema", () => {
  it("text と report の正常データをパースできる", () => {
    const data = {
      text: "まとめです",
      report: validReport,
    };
    const result = interviewChatWithReportSchema.parse(data);
    expect(result.text).toBe("まとめです");
    expect(result.report.summary).toBe(validReport.summary);
  });

  it("text が欠けている場合を拒否する", () => {
    const result = interviewChatWithReportSchema.safeParse({
      report: validReport,
    });
    expect(result.success).toBe(false);
  });

  it("report が欠けている場合を拒否する", () => {
    const result = interviewChatWithReportSchema.safeParse({
      text: "テスト",
    });
    expect(result.success).toBe(false);
  });
});

describe("interviewChatResponseSchema", () => {
  it("最小限のデータ (text のみ) をパースできる", () => {
    const result = interviewChatResponseSchema.parse({ text: "テスト" });
    expect(result.text).toBe("テスト");
    expect(result.report).toBeUndefined();
    expect(result.quick_replies).toBeUndefined();
    expect(result.question_id).toBeUndefined();
    expect(result.topic_title).toBeUndefined();
    expect(result.next_stage).toBeUndefined();
  });

  it("全フィールド指定でパースできる", () => {
    const data = {
      text: "テスト",
      report: validReport,
      quick_replies: ["選択肢1"],
      question_id: "q1",
      topic_title: "トピック",
      next_stage: "summary" as const,
    };
    const result = interviewChatResponseSchema.parse(data);
    expect(result.text).toBe("テスト");
    expect(result.report?.summary).toBe(validReport.summary);
    expect(result.quick_replies).toEqual(["選択肢1"]);
    expect(result.question_id).toBe("q1");
    expect(result.topic_title).toBe("トピック");
    expect(result.next_stage).toBe("summary");
  });

  it("report が optional であること", () => {
    const result = interviewChatResponseSchema.parse({ text: "テスト" });
    expect(result.report).toBeUndefined();
  });

  it("quick_replies が optional かつ nullable であること", () => {
    const withNull = interviewChatResponseSchema.parse({
      text: "テスト",
      quick_replies: null,
    });
    expect(withNull.quick_replies).toBeNull();

    const withoutField = interviewChatResponseSchema.parse({ text: "テスト" });
    expect(withoutField.quick_replies).toBeUndefined();
  });

  it("question_id が optional かつ nullable であること", () => {
    const withNull = interviewChatResponseSchema.parse({
      text: "テスト",
      question_id: null,
    });
    expect(withNull.question_id).toBeNull();

    const withoutField = interviewChatResponseSchema.parse({ text: "テスト" });
    expect(withoutField.question_id).toBeUndefined();
  });

  it("topic_title が optional かつ nullable であること", () => {
    const withNull = interviewChatResponseSchema.parse({
      text: "テスト",
      topic_title: null,
    });
    expect(withNull.topic_title).toBeNull();

    const withoutField = interviewChatResponseSchema.parse({ text: "テスト" });
    expect(withoutField.topic_title).toBeUndefined();
  });

  it("next_stage が optional であること", () => {
    const result = interviewChatResponseSchema.parse({ text: "テスト" });
    expect(result.next_stage).toBeUndefined();
  });

  it("text が欠けている場合を拒否する", () => {
    const result = interviewChatResponseSchema.safeParse({
      quick_replies: [],
    });
    expect(result.success).toBe(false);
  });
});
