import { describe, expect, it } from "vitest";
import { mapQuestionAnswerCounts } from "./map-question-answer-counts";

describe("mapQuestionAnswerCounts", () => {
  it("snake_caseの行をcamelCaseに変換する", () => {
    const result = mapQuestionAnswerCounts([
      {
        question_id: "q1",
        question: "質問1",
        question_order: 1,
        asked_session_count: 10,
        answered_session_count: 8,
      },
      {
        question_id: "q2",
        question: "質問2",
        question_order: 2,
        asked_session_count: 5,
        answered_session_count: 0,
      },
    ]);

    expect(result).toEqual([
      {
        questionId: "q1",
        question: "質問1",
        questionOrder: 1,
        askedSessionCount: 10,
        answeredSessionCount: 8,
      },
      {
        questionId: "q2",
        question: "質問2",
        questionOrder: 2,
        askedSessionCount: 5,
        answeredSessionCount: 0,
      },
    ]);
  });

  it("空配列は空配列を返す", () => {
    expect(mapQuestionAnswerCounts([])).toEqual([]);
  });
});
