import { describe, expect, it } from "vitest";
import { validateQuestionId } from "./validate-question-id";

describe("validateQuestionId", () => {
  it("questionIdがnullならそのまま返す", () => {
    const result = validateQuestionId({
      questionId: null,
      quickReplies: ["選択肢A"],
      previousMessages: [],
    });
    expect(result).toEqual({
      questionId: null,
      quickReplies: ["選択肢A"],
    });
  });

  it("未使用のquestionIdはそのまま返す", () => {
    const result = validateQuestionId({
      questionId: "q1",
      quickReplies: ["はい", "いいえ"],
      previousMessages: [{ role: "assistant", questionId: "q2" }],
    });
    expect(result).toEqual({
      questionId: "q1",
      quickReplies: ["はい", "いいえ"],
    });
  });

  it("既出のquestionIdならquestionIdとquickRepliesの両方をクリアする", () => {
    const result = validateQuestionId({
      questionId: "q1",
      quickReplies: ["はい", "いいえ"],
      previousMessages: [{ role: "assistant", questionId: "q1" }],
    });
    expect(result).toEqual({
      questionId: null,
      quickReplies: [],
    });
  });

  it("userメッセージのquestionIdは既出判定に使わない", () => {
    const result = validateQuestionId({
      questionId: "q1",
      quickReplies: ["はい"],
      previousMessages: [{ role: "user", questionId: "q1" }],
    });
    expect(result).toEqual({
      questionId: "q1",
      quickReplies: ["はい"],
    });
  });

  it("previousMessagesが空なら既出扱いにならない", () => {
    const result = validateQuestionId({
      questionId: "q1",
      quickReplies: ["選択肢"],
      previousMessages: [],
    });
    expect(result).toEqual({
      questionId: "q1",
      quickReplies: ["選択肢"],
    });
  });
});
