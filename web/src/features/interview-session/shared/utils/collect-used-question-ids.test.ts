import { describe, expect, it } from "vitest";
import { collectUsedQuestionIds } from "./collect-used-question-ids";

describe("collectUsedQuestionIds", () => {
  it("空配列に対して空Setを返す", () => {
    expect(collectUsedQuestionIds([])).toEqual(new Set());
  });

  it("assistantメッセージのquestionIdを収集する", () => {
    const messages = [
      { role: "assistant", questionId: "q1" },
      { role: "assistant", questionId: "q2" },
    ];
    expect(collectUsedQuestionIds(messages)).toEqual(new Set(["q1", "q2"]));
  });

  it("userメッセージは無視する", () => {
    const messages = [
      { role: "user", questionId: "q1" },
      { role: "assistant", questionId: "q2" },
    ];
    expect(collectUsedQuestionIds(messages)).toEqual(new Set(["q2"]));
  });

  it("questionIdがnullまたはundefinedのメッセージは無視する", () => {
    const messages = [
      { role: "assistant", questionId: null },
      { role: "assistant", questionId: undefined },
      { role: "assistant" },
      { role: "assistant", questionId: "q1" },
    ];
    expect(collectUsedQuestionIds(messages)).toEqual(new Set(["q1"]));
  });

  it("重複するquestionIdは1つにまとめる", () => {
    const messages = [
      { role: "assistant", questionId: "q1" },
      { role: "assistant", questionId: "q1" },
    ];
    expect(collectUsedQuestionIds(messages)).toEqual(new Set(["q1"]));
  });
});
