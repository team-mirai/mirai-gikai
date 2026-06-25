import { describe, expect, it } from "vitest";
import type { InterviewQuestionInput } from "../../shared/types";
import { type SortableQuestion, toInputs, withUid } from "./sortable-question";

describe("withUid", () => {
  it("元のフィールドを保持したまま _uid を付与する", () => {
    const input: InterviewQuestionInput = {
      question: "好きな色は？",
      follow_up_guide: "理由も聞く",
      quick_replies: ["赤", "青"],
      target_audience: "全員",
    };

    const result = withUid(input);

    expect(result._uid).toBeTruthy();
    expect(result).toMatchObject(input);
  });

  it("呼び出しごとに異なる _uid を割り当てる", () => {
    const input: InterviewQuestionInput = { question: "Q" };

    expect(withUid(input)._uid).not.toBe(withUid(input)._uid);
  });
});

describe("toInputs", () => {
  it("_uid を取り除いて InterviewQuestionInput[] に戻す", () => {
    const items: SortableQuestion[] = [
      { _uid: "a", question: "Q1" },
      { _uid: "b", question: "Q2", follow_up_guide: "g" },
    ];

    const result = toInputs(items);

    expect(result).toEqual([
      { question: "Q1" },
      { question: "Q2", follow_up_guide: "g" },
    ]);
    expect(result.every((q) => !("_uid" in q))).toBe(true);
  });

  it("配列の順序を維持する", () => {
    const items: SortableQuestion[] = [
      { _uid: "a", question: "Q1" },
      { _uid: "b", question: "Q2" },
      { _uid: "c", question: "Q3" },
    ];

    expect(toInputs(items).map((q) => q.question)).toEqual(["Q1", "Q2", "Q3"]);
  });

  it("withUid とのラウンドトリップで元の入力に一致する", () => {
    const inputs: InterviewQuestionInput[] = [
      { question: "Q1", quick_replies: ["a"] },
      { question: "Q2" },
    ];

    expect(toInputs(inputs.map(withUid))).toEqual(inputs);
  });
});
