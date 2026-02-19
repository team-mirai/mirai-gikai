import { describe, expect, it } from "vitest";
import type { InterviewQuestion } from "../types";
import { prepareQuestionsForDuplication } from "./prepare-questions-for-duplication";

const baseQuestions: InterviewQuestion[] = [
  {
    id: "q-001",
    interview_config_id: "config-001",
    question: "質問1",
    instruction: "指示1",
    quick_replies: ["はい", "いいえ"],
    question_order: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "q-002",
    interview_config_id: "config-001",
    question: "質問2",
    instruction: null,
    quick_replies: null,
    question_order: 2,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

describe("prepareQuestionsForDuplication", () => {
  it("新しいconfig_idを設定する", () => {
    const result = prepareQuestionsForDuplication(
      baseQuestions,
      "new-config-id"
    );
    for (const q of result) {
      expect(q.interview_config_id).toBe("new-config-id");
    }
  });

  it("id, created_at, updated_atを含まない", () => {
    const result = prepareQuestionsForDuplication(
      baseQuestions,
      "new-config-id"
    );
    for (const q of result) {
      expect(q).not.toHaveProperty("id");
      expect(q).not.toHaveProperty("created_at");
      expect(q).not.toHaveProperty("updated_at");
    }
  });

  it("質問内容とorderを保持する", () => {
    const result = prepareQuestionsForDuplication(
      baseQuestions,
      "new-config-id"
    );
    expect(result).toHaveLength(2);
    expect(result[0].question).toBe("質問1");
    expect(result[0].instruction).toBe("指示1");
    expect(result[0].quick_replies).toEqual(["はい", "いいえ"]);
    expect(result[0].question_order).toBe(1);
    expect(result[1].question).toBe("質問2");
    expect(result[1].instruction).toBeNull();
    expect(result[1].quick_replies).toBeNull();
    expect(result[1].question_order).toBe(2);
  });

  it("空配列を渡すと空配列を返す", () => {
    const result = prepareQuestionsForDuplication([], "new-config-id");
    expect(result).toEqual([]);
  });
});
