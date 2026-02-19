import { describe, expect, it } from "vitest";
import type { InterviewQuestionInput } from "../types";
import { prepareQuestionsForInsert } from "./prepare-questions-for-insert";

const questions: InterviewQuestionInput[] = [
  {
    question: "質問A",
    instruction: "指示A",
    quick_replies: ["選択肢1", "選択肢2"],
  },
  {
    question: "質問B",
  },
  {
    question: "質問C",
    instruction: undefined,
    quick_replies: undefined,
  },
];

describe("prepareQuestionsForInsert", () => {
  it("config_idを設定する", () => {
    const result = prepareQuestionsForInsert(questions, "config-123");
    for (const q of result) {
      expect(q.interview_config_id).toBe("config-123");
    }
  });

  it("question_orderを1始まりのインデックスで設定する", () => {
    const result = prepareQuestionsForInsert(questions, "config-123");
    expect(result[0].question_order).toBe(1);
    expect(result[1].question_order).toBe(2);
    expect(result[2].question_order).toBe(3);
  });

  it("質問内容を保持する", () => {
    const result = prepareQuestionsForInsert(questions, "config-123");
    expect(result[0].question).toBe("質問A");
    expect(result[0].instruction).toBe("指示A");
    expect(result[0].quick_replies).toEqual(["選択肢1", "選択肢2"]);
  });

  it("未設定のinstruction/quick_repliesをnullに変換する", () => {
    const result = prepareQuestionsForInsert(questions, "config-123");
    expect(result[1].instruction).toBeNull();
    expect(result[1].quick_replies).toBeNull();
    expect(result[2].instruction).toBeNull();
    expect(result[2].quick_replies).toBeNull();
  });

  it("空配列を渡すと空配列を返す", () => {
    const result = prepareQuestionsForInsert([], "config-123");
    expect(result).toEqual([]);
  });
});
