import { describe, expect, it } from "vitest";
import { SUGGEST_INTERVIEW_TOOL_TYPE } from "@/features/chat/shared/constants";
import { shouldShowInterviewSuggestion } from "./should-show-interview-suggestion";

describe("shouldShowInterviewSuggestion", () => {
  const partsWithSuggestion = [
    { type: SUGGEST_INTERVIEW_TOOL_TYPE },
    { type: "step-start" },
    { type: "text" },
  ];

  it("ストリーミング完了後に suggest_interview があれば true を返す", () => {
    expect(shouldShowInterviewSuggestion(partsWithSuggestion, false)).toBe(
      true
    );
  });

  it("ストリーミング中は suggest_interview があっても false を返す", () => {
    expect(shouldShowInterviewSuggestion(partsWithSuggestion, true)).toBe(
      false
    );
  });

  it("suggest_interview が無ければ false を返す", () => {
    expect(shouldShowInterviewSuggestion([{ type: "text" }], false)).toBe(
      false
    );
  });
});
