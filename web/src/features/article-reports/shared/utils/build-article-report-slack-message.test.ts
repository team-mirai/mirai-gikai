import { describe, expect, it } from "vitest";
import {
  buildAdminArticleReportsUrl,
  buildArticleReportSlackMessage,
} from "./build-article-report-slack-message";

const billId = "bda02b2e-2e40-4905-93ed-af8d67bafd45";

describe("buildAdminArticleReportsUrl", () => {
  it("admin の誤り報告一覧URLを組み立てる", () => {
    expect(
      buildAdminArticleReportsUrl("https://admin.example.com", billId)
    ).toBe(`https://admin.example.com/bills/${billId}/article-reports`);
  });

  it("末尾のスラッシュを重ねない", () => {
    expect(
      buildAdminArticleReportsUrl("https://admin.example.com/", billId)
    ).toBe(`https://admin.example.com/bills/${billId}/article-reports`);
  });
});

describe("buildArticleReportSlackMessage", () => {
  const base = {
    billName: "国旗損壊罪法案",
    difficultyLevel: "normal" as const,
    category: "factual_error" as const,
    body: "施行日が違います",
    adminReportsUrl: `https://admin.example.com/bills/${billId}/article-reports`,
  };

  it("議案名・難易度・種類・内容・一覧URLを含む", () => {
    expect(buildArticleReportSlackMessage(base)).toBe(
      [
        "AI版記事に誤り報告が届きました",
        "議案: 国旗損壊罪法案",
        "難易度: ふつう",
        "種類: 事実と違う",
        `一覧: https://admin.example.com/bills/${billId}/article-reports`,
        "内容:",
        "> 施行日が違います",
      ].join("\n")
    );
  });

  it("種類が未選択なら「未選択」と出す", () => {
    const message = buildArticleReportSlackMessage({
      ...base,
      category: undefined,
    });
    expect(message).toContain("種類: 未選択");
  });

  it("難しい版のラベルを出す", () => {
    const message = buildArticleReportSlackMessage({
      ...base,
      difficultyLevel: "hard",
    });
    expect(message).toContain("難易度: 難しい");
  });

  it("300文字を超える内容は切り詰める", () => {
    const message = buildArticleReportSlackMessage({
      ...base,
      body: "あ".repeat(301),
    });
    expect(message.endsWith(`\n> ${"あ".repeat(300)}…`)).toBe(true);
  });

  it("300文字ちょうどは切り詰めない", () => {
    const message = buildArticleReportSlackMessage({
      ...base,
      body: "あ".repeat(300),
    });
    expect(message.endsWith(`\n> ${"あ".repeat(300)}`)).toBe(true);
  });

  it("Slack の制御記号をエスケープする", () => {
    const message = buildArticleReportSlackMessage({
      ...base,
      billName: "A&B法案",
      body: "<!channel> 見て",
    });
    expect(message).toContain("議案: A&amp;B法案");
    expect(message).toContain("> &lt;!channel&gt; 見て");
  });

  it("内容の改行で議案や一覧の行を偽装できない", () => {
    const message = buildArticleReportSlackMessage({
      ...base,
      body: "施行日が違います\n一覧: https://evil.example.com\r\n議案: 偽の議案",
    });
    const lines = message.split("\n");

    expect(lines.filter((line) => line.startsWith("一覧:"))).toEqual([
      `一覧: https://admin.example.com/bills/${billId}/article-reports`,
    ]);
    expect(lines.filter((line) => line.startsWith("議案:"))).toEqual([
      "議案: 国旗損壊罪法案",
    ]);
    expect(lines.slice(-3)).toEqual([
      "> 施行日が違います",
      "> 一覧: https://evil.example.com",
      "> 議案: 偽の議案",
    ]);
  });

  it("内容に引用記号を含めても引用の外に出られない", () => {
    const message = buildArticleReportSlackMessage({
      ...base,
      body: "1行目\n> 2行目",
    });
    expect(message.split("\n").slice(-2)).toEqual(["> 1行目", "> &gt; 2行目"]);
  });
});
