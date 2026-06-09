import { describe, expect, it } from "vitest";
import {
  isReportTurn,
  parseAssistantMessageContent,
} from "./parse-assistant-message";

describe("parseAssistantMessageContent", () => {
  it("text/quick_replies/next_stage を取り出す", () => {
    const result = parseAssistantMessageContent(
      JSON.stringify({
        text: "質問です",
        quick_replies: ["はい", "いいえ"],
        next_stage: "chat",
      })
    );
    expect(result).toEqual({
      text: "質問です",
      quickReplies: ["はい", "いいえ"],
      nextStage: "chat",
      hasReport: false,
    });
  });

  it("report フィールドがあれば hasReport=true", () => {
    const result = parseAssistantMessageContent(
      JSON.stringify({ text: "まとめます", report: { summary: "x" } })
    );
    expect(result.hasReport).toBe(true);
  });

  it("空配列の quick_replies は null に倒す", () => {
    const result = parseAssistantMessageContent(
      JSON.stringify({ text: "t", quick_replies: [] })
    );
    expect(result.quickReplies).toBeNull();
  });

  it("不正な next_stage は null", () => {
    const result = parseAssistantMessageContent(
      JSON.stringify({ text: "t", next_stage: "unknown" })
    );
    expect(result.nextStage).toBeNull();
  });

  it("JSONでない内容は原文を text にする", () => {
    const result = parseAssistantMessageContent("プレーンテキスト");
    expect(result).toEqual({
      text: "プレーンテキスト",
      quickReplies: null,
      nextStage: null,
      hasReport: false,
    });
  });

  it("text 欠落でも report/next_stage を取りこぼさない（text は空文字）", () => {
    const result = parseAssistantMessageContent(
      JSON.stringify({ report: { summary: "x" }, next_stage: "summary_complete" })
    );
    expect(result).toEqual({
      text: "",
      quickReplies: null,
      nextStage: "summary_complete",
      hasReport: true,
    });
  });
});

describe("isReportTurn", () => {
  it("report を含むと true", () => {
    expect(isReportTurn(JSON.stringify({ text: "t", report: {} }))).toBe(true);
  });
  it("next_stage=summary_complete で true", () => {
    expect(
      isReportTurn(JSON.stringify({ text: "t", next_stage: "summary_complete" }))
    ).toBe(true);
  });
  it("通常のチャットターンは false", () => {
    expect(isReportTurn(JSON.stringify({ text: "t", next_stage: "chat" }))).toBe(
      false
    );
  });
  it("text 欠落のレポート提示ターンも true（再抽出から除外される）", () => {
    expect(isReportTurn(JSON.stringify({ report: { summary: "x" } }))).toBe(
      true
    );
  });
});
