import { describe, expect, it } from "vitest";
import { extractReportFromMessage } from "./report-extraction";

describe("extractReportFromMessage", () => {
  const validReport = {
    text: "まとめです",
    report: {
      summary: "テスト要約",
      stance: "for",
      role: "general_citizen",
      role_description: "一般市民です",
      role_title: "市民",
      opinions: [{ title: "意見1", content: "内容1" }],
      scores: {
        total: 75,
        clarity: 80,
        specificity: 70,
        impact: 65,
        constructiveness: 85,
        reasoning: "よくまとまっています",
      },
    },
  };

  it("有効なJSONからレポートを抽出する", () => {
    const result = extractReportFromMessage(JSON.stringify(validReport));
    expect(result).not.toBeNull();
    expect(result?.summary).toBe("テスト要約");
    expect(result?.stance).toBe("for");
    expect(result?.role).toBe("general_citizen");
    expect(result?.opinions).toHaveLength(1);
    expect(result?.scores.total).toBe(75);
  });

  it("JSONでない文字列はnullを返す", () => {
    const result = extractReportFromMessage("普通のテキスト");
    expect(result).toBeNull();
  });

  it("reportフィールドがないJSONはnullを返す", () => {
    const result = extractReportFromMessage(JSON.stringify({ text: "テスト" }));
    expect(result).toBeNull();
  });

  it("reportのバリデーションが失敗したらnullを返す", () => {
    const invalid = {
      text: "テスト",
      report: {
        summary: "要約",
        // stanceが不正な値
        stance: "invalid_stance",
      },
    };
    const result = extractReportFromMessage(JSON.stringify(invalid));
    expect(result).toBeNull();
  });

  it("空文字列はnullを返す", () => {
    const result = extractReportFromMessage("");
    expect(result).toBeNull();
  });

  it("スコアの小数値は丸められる", () => {
    const reportWithDecimalScores = {
      text: "まとめ",
      report: {
        ...validReport.report,
        scores: {
          total: 75.4,
          clarity: 80.6,
          specificity: 70.5,
          impact: 65.1,
          constructiveness: 85.9,
          reasoning: "スコアテスト",
        },
      },
    };
    const result = extractReportFromMessage(
      JSON.stringify(reportWithDecimalScores)
    );
    expect(result).not.toBeNull();
    expect(result?.scores.total).toBe(75);
    expect(result?.scores.clarity).toBe(81);
  });
});
