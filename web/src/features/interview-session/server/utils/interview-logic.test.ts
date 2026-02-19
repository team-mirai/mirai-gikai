import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { collectAskedQuestionIds } from "./interview-logic";

describe("collectAskedQuestionIds", () => {
  it("空のメッセージ配列なら空のSetを返す", () => {
    const result = collectAskedQuestionIds([]);
    expect(result.size).toBe(0);
  });

  it("assistantメッセージからquestionIdを抽出する", () => {
    const messages = [
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問です", question_id: "q1" }),
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result).toEqual(new Set(["q1"]));
  });

  it("questionIdキー（キャメルケース）からも抽出できる", () => {
    const messages = [
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問です", questionId: "q2" }),
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result).toEqual(new Set(["q2"]));
  });

  it("userロールのメッセージはスキップする", () => {
    const messages = [
      {
        role: "user",
        content: JSON.stringify({ text: "回答です", question_id: "q1" }),
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result.size).toBe(0);
  });

  it("questionIdがないassistantメッセージはスキップする", () => {
    const messages = [
      {
        role: "assistant",
        content: JSON.stringify({ text: "挨拶です" }),
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result.size).toBe(0);
  });

  it("JSONでないcontentのassistantメッセージはスキップする", () => {
    const messages = [
      {
        role: "assistant",
        content: "プレーンテキストメッセージ",
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result.size).toBe(0);
  });

  it("重複するquestionIdは一意にまとめられる", () => {
    const messages = [
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問1", question_id: "q1" }),
      },
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問1再送", question_id: "q1" }),
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result).toEqual(new Set(["q1"]));
    expect(result.size).toBe(1);
  });

  it("複数のassistantメッセージから複数のquestionIdを抽出する", () => {
    const messages = [
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問1", question_id: "q1" }),
      },
      { role: "user", content: "回答1" },
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問2", question_id: "q2" }),
      },
      { role: "user", content: "回答2" },
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問3", question_id: "q3" }),
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result).toEqual(new Set(["q1", "q2", "q3"]));
    expect(result.size).toBe(3);
  });

  it("assistant以外のロール（systemなど）もスキップする", () => {
    const messages = [
      {
        role: "system",
        content: JSON.stringify({ text: "システム", question_id: "q1" }),
      },
      {
        role: "assistant",
        content: JSON.stringify({ text: "質問", question_id: "q2" }),
      },
    ];
    const result = collectAskedQuestionIds(messages);
    expect(result).toEqual(new Set(["q2"]));
  });
});
