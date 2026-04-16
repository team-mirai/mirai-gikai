import { describe, expect, it } from "vitest";
import { extractOriginalStyleAnchors } from "./extract-original-style-anchors";

describe("extractOriginalStyleAnchors", () => {
  it("空会話の場合はゼロ値を返す", () => {
    const result = extractOriginalStyleAnchors([]);
    expect(result.avgResponseChars).toBe(0);
    expect(result.sampleResponses).toEqual([]);
    expect(result.originalInterviewerTurns).toBe(0);
    expect(result.originalIntervieweeTurns).toBe(0);
  });

  it("インタビュアー・インタビュイーのターン数をカウントする", () => {
    const result = extractOriginalStyleAnchors([
      { role: "interviewer", content: "Q1" },
      { role: "interviewee", content: "A1" },
      { role: "interviewer", content: "Q2" },
      { role: "interviewee", content: "A2" },
      { role: "interviewee", content: "A2 追加" },
      { role: "interviewer", content: "締め" },
    ]);
    expect(result.originalInterviewerTurns).toBe(3);
    expect(result.originalIntervieweeTurns).toBe(3);
  });

  it("インタビュイーのみの文字数統計を計算する", () => {
    const result = extractOriginalStyleAnchors([
      { role: "interviewer", content: "長い質問" }, // 4
      { role: "interviewee", content: "はい" }, // 2
      { role: "interviewee", content: "そう思います" }, // 6
      { role: "interviewee", content: "わかりません" }, // 6
    ]);
    expect(result.minResponseChars).toBe(2);
    expect(result.maxResponseChars).toBe(6);
    expect(result.medianResponseChars).toBe(6);
    // avg = (2 + 6 + 6) / 3 = 4.67 → round = 5
    expect(result.avgResponseChars).toBe(5);
  });

  it("インタビュアーの発話は無視される", () => {
    const result = extractOriginalStyleAnchors([
      { role: "interviewer", content: "とても長い質問文章" },
      { role: "interviewee", content: "短い" },
    ]);
    expect(result.avgResponseChars).toBe(2);
    expect(result.maxResponseChars).toBe(2);
  });

  it("3 件以下ならすべてのインタビュイー回答をサンプルに含む", () => {
    const result = extractOriginalStyleAnchors([
      { role: "interviewee", content: "A" },
      { role: "interviewee", content: "B" },
      { role: "interviewee", content: "C" },
    ]);
    expect(result.sampleResponses).toEqual(["A", "B", "C"]);
  });

  it("4 件以上のときは先頭・中央・末尾を抜粋する", () => {
    const turns = ["A", "B", "C", "D", "E"];
    const result = extractOriginalStyleAnchors(
      turns.map((content) => ({ role: "interviewee" as const, content }))
    );
    expect(result.sampleResponses).toEqual(["A", "C", "E"]);
  });

  it("前後の空白をトリムして扱う", () => {
    const result = extractOriginalStyleAnchors([
      { role: "interviewee", content: "  はい  " },
      { role: "interviewee", content: "  そうです  " },
    ]);
    // trim 後: "はい"=2, "そうです"=4
    expect(result.minResponseChars).toBe(2);
    expect(result.maxResponseChars).toBe(4);
  });

  it("空文字のインタビュイー回答はスキップする", () => {
    const result = extractOriginalStyleAnchors([
      { role: "interviewee", content: "" },
      { role: "interviewee", content: "本物の回答" }, // 5
    ]);
    expect(result.avgResponseChars).toBe(5);
    expect(result.sampleResponses).toEqual(["本物の回答"]);
  });
});
