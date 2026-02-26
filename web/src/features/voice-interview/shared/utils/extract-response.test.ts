import { describe, expect, it } from "vitest";
import {
  extractText,
  extractResponse,
  normalizeMessages,
} from "./extract-response";

describe("extractText", () => {
  it("JSON文字列から text フィールドを抽出する", () => {
    const raw = JSON.stringify({ text: "こんにちは" });
    expect(extractText(raw)).toBe("こんにちは");
  });

  it("text フィールドがない JSON はそのまま返す", () => {
    const raw = JSON.stringify({ message: "hello" });
    expect(extractText(raw)).toBe(raw);
  });

  it("プレーンテキストはそのまま返す", () => {
    expect(extractText("こんにちは")).toBe("こんにちは");
  });

  it("空文字列はそのまま返す", () => {
    expect(extractText("")).toBe("");
  });

  it("不正なJSONはそのまま返す", () => {
    expect(extractText("{invalid")).toBe("{invalid");
  });
});

describe("extractResponse", () => {
  it("text を抽出する", () => {
    const raw = JSON.stringify({ text: "AIの回答です" });
    const result = extractResponse(raw);
    expect(result.text).toBe("AIの回答です");
  });

  it("next_stage を抽出する", () => {
    const raw = JSON.stringify({ text: "回答", next_stage: "summary" });
    const result = extractResponse(raw);
    expect(result.nextStage).toBe("summary");
  });

  it("session_id を抽出する", () => {
    const raw = JSON.stringify({ text: "回答", session_id: "abc-123" });
    const result = extractResponse(raw);
    expect(result.sessionId).toBe("abc-123");
  });

  it("report から scores を除外して抽出する", () => {
    const raw = JSON.stringify({
      text: "まとめ",
      report: {
        summary: "要約テキスト",
        opinions: [{ title: "意見1", content: "内容1" }],
        scores: { total: 80, clarity: 70, specificity: 60 },
      },
    });
    const result = extractResponse(raw);
    expect(result.report).toEqual({
      summary: "要約テキスト",
      opinions: [{ title: "意見1", content: "内容1" }],
    });
    expect(result.report).not.toHaveProperty("scores");
  });

  it("report がない場合は undefined", () => {
    const raw = JSON.stringify({ text: "回答" });
    const result = extractResponse(raw);
    expect(result.report).toBeUndefined();
  });

  it("text フィールドがない場合は raw を text として返す", () => {
    const raw = JSON.stringify({ message: "hello" });
    const result = extractResponse(raw);
    expect(result.text).toBe(raw);
  });

  it("不正なJSONはプレーンテキストとして扱う", () => {
    const result = extractResponse("plain text");
    expect(result.text).toBe("plain text");
    expect(result.nextStage).toBeUndefined();
    expect(result.sessionId).toBeUndefined();
    expect(result.report).toBeUndefined();
  });

  it("全フィールドを同時に抽出できる", () => {
    const raw = JSON.stringify({
      text: "最終回答",
      next_stage: "summary_complete",
      session_id: "session-xyz",
      report: {
        summary: "全体のまとめ",
        opinions: [],
        scores: { total: 90 },
      },
    });
    const result = extractResponse(raw);
    expect(result.text).toBe("最終回答");
    expect(result.nextStage).toBe("summary_complete");
    expect(result.sessionId).toBe("session-xyz");
    expect(result.report).toEqual({
      summary: "全体のまとめ",
      opinions: [],
    });
  });
});

describe("normalizeMessages", () => {
  it("JSON形式のcontent をプレーンテキストに変換する", () => {
    const msgs = [
      { role: "assistant" as const, content: JSON.stringify({ text: "質問" }) },
      { role: "user" as const, content: "回答" },
    ];
    const result = normalizeMessages(msgs);
    expect(result[0].content).toBe("質問");
    expect(result[1].content).toBe("回答");
  });

  it("プレーンテキストはそのまま保持する", () => {
    const msgs = [
      { role: "assistant" as const, content: "こんにちは" },
      { role: "user" as const, content: "はい" },
    ];
    const result = normalizeMessages(msgs);
    expect(result[0].content).toBe("こんにちは");
    expect(result[1].content).toBe("はい");
  });

  it("空配列を処理できる", () => {
    expect(normalizeMessages([])).toEqual([]);
  });

  it("role を保持する", () => {
    const msgs = [
      { role: "assistant" as const, content: JSON.stringify({ text: "hi" }) },
    ];
    const result = normalizeMessages(msgs);
    expect(result[0].role).toBe("assistant");
  });
});
