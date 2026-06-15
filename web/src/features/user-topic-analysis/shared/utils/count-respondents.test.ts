import { describe, expect, it } from "vitest";
import type { PublicOpinion, PublicTopic } from "../types";
import { countTopicRespondents } from "./count-respondents";

function op(reportId: string): PublicOpinion {
  return {
    id: `op-${Math.random()}`,
    interview_report_id: reportId,
    report_public: true,
    created_at: null,
    title: "t",
    content: "c",
    user_category: "citizen",
    role_title: null,
    bill_sentiment: null,
    contextual_quote: null,
    richness: null,
    source_message_id: null,
    question_snippet: null,
  };
}

function topic(id: string, opinions: PublicOpinion[]): PublicTopic {
  return {
    id,
    title: id,
    description: "",
    opinion_count: opinions.length,
    affected_count: 0,
    industry_count: 0,
    expert_count: 0,
    citizen_count: 0,
    sentiment: { 期待: 0, 懸念: 0 },
    opinions,
  };
}

describe("countTopicRespondents", () => {
  it("トピック横断で出典レポートIDをユニークに数える", () => {
    const topics = [
      topic("a", [op("r1"), op("r2"), op("r2")]),
      topic("b", [op("r2"), op("r3")]),
    ];
    // r1, r2, r3 → 3
    expect(countTopicRespondents(topics)).toBe(3);
  });

  it("空なら0", () => {
    expect(countTopicRespondents([])).toBe(0);
  });
});
