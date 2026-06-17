import { describe, expect, it } from "vitest";
import type { PublicOpinion, PublicTopic, UserCategory } from "../types";
import {
  filterAndSortTopics,
  filterOpinions,
  parseTopicFilter,
  sentimentOfFilter,
  type TopicFilter,
  topicSortLabel,
  userCategoryOfFilter,
} from "./filter-topics";

function makeOpinion(
  id: string,
  overrides: Partial<PublicOpinion> = {}
): PublicOpinion {
  return {
    id,
    interview_report_id: `r-${id}`,
    report_public: true,
    created_at: null,
    title: `op-${id}`,
    content: "",
    user_category: "citizen",
    role_title: null,
    bill_sentiment: null,
    contextual_quote: null,
    richness: null,
    source_message_id: null,
    question_snippet: null,
    ...overrides,
  };
}

function makeTopic(
  id: string,
  overrides: Partial<PublicTopic> = {}
): PublicTopic {
  return {
    id,
    title: `topic-${id}`,
    description: "",
    opinion_count: 0,
    affected_count: 0,
    industry_count: 0,
    expert_count: 0,
    citizen_count: 0,
    sentiment: { 期待: 0, 懸念: 0 },
    opinions: [],
    ...overrides,
  };
}

describe("filterAndSortTopics", () => {
  it("all のときは元の順序を維持する", () => {
    const topics = [makeTopic("a"), makeTopic("b"), makeTopic("c")];
    expect(filterAndSortTopics(topics, "all")).toEqual(topics);
  });

  it("カテゴリ指定で件数0のトピックを除外し件数降順で並べる", () => {
    const topics = [
      makeTopic("a", { industry_count: 2 }),
      makeTopic("b", { industry_count: 0 }),
      makeTopic("c", { industry_count: 5 }),
    ];
    const result = filterAndSortTopics(topics, "industry");
    expect(result.map((t) => t.id)).toEqual(["c", "a"]);
  });

  it("件数が同数のときは元の順序を保つ（安定ソート）", () => {
    const topics = [
      makeTopic("a", { expert_count: 3 }),
      makeTopic("b", { expert_count: 3 }),
      makeTopic("c", { expert_count: 3 }),
    ];
    const result = filterAndSortTopics(topics, "expert");
    expect(result.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("期待・懸念は sentiment の件数で絞り込み・並べ替えする", () => {
    const topics = [
      makeTopic("a", { sentiment: { 期待: 1, 懸念: 9 } }),
      makeTopic("b", { sentiment: { 期待: 8, 懸念: 0 } }),
      makeTopic("c", { sentiment: { 期待: 0, 懸念: 4 } }),
    ];
    expect(filterAndSortTopics(topics, "期待").map((t) => t.id)).toEqual([
      "b",
      "a",
    ]);
    expect(filterAndSortTopics(topics, "懸念").map((t) => t.id)).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("filterOpinions", () => {
  const opinions = [
    makeOpinion("a", { user_category: "affected", bill_sentiment: "期待" }),
    makeOpinion("b", { user_category: "industry", bill_sentiment: "懸念" }),
    makeOpinion("c", { user_category: "expert", bill_sentiment: null }),
  ];

  it("all は全件返す", () => {
    expect(filterOpinions(opinions, "all")).toHaveLength(3);
  });

  it("カテゴリで user_category 一致のみ返す", () => {
    expect(filterOpinions(opinions, "industry").map((o) => o.id)).toEqual([
      "b",
    ]);
  });

  it("期待・懸念で bill_sentiment 一致のみ返す", () => {
    expect(filterOpinions(opinions, "期待").map((o) => o.id)).toEqual(["a"]);
    expect(filterOpinions(opinions, "懸念").map((o) => o.id)).toEqual(["b"]);
  });
});

describe("parseTopicFilter", () => {
  it("有効な値はそのまま返す", () => {
    for (const v of [
      "all",
      "affected",
      "industry",
      "expert",
      "citizen",
      "期待",
      "懸念",
    ]) {
      expect(parseTopicFilter(v)).toBe(v);
    }
  });

  it("不正値・null・undefined は all に倒す", () => {
    expect(parseTopicFilter("xxx")).toBe("all");
    expect(parseTopicFilter(null)).toBe("all");
    expect(parseTopicFilter(undefined)).toBe("all");
  });
});

describe("topicSortLabel", () => {
  it("all のときは null", () => {
    expect(topicSortLabel("all")).toBeNull();
  });

  it.each<[TopicFilter, string]>([
    ["affected", "当事者が多い順"],
    ["industry", "事業者が多い順"],
    ["expert", "専門家が多い順"],
    ["期待", "期待が多い順"],
    ["懸念", "懸念が多い順"],
  ])("%s のラベルは %s", (filter, expected) => {
    expect(topicSortLabel(filter)).toBe(expected);
  });
});

describe("userCategoryOfFilter", () => {
  it.each<[UserCategory]>([
    ["affected"],
    ["industry"],
    ["expert"],
    ["citizen"],
  ])("カテゴリ %s はそのまま返す（市民の取りこぼし回帰防止）", (filter) => {
    expect(userCategoryOfFilter(filter)).toBe(filter);
  });

  it.each<[TopicFilter]>([
    ["all"],
    ["期待"],
    ["懸念"],
  ])("カテゴリ以外 %s は null", (filter) => {
    expect(userCategoryOfFilter(filter)).toBeNull();
  });
});

describe("sentimentOfFilter", () => {
  it("期待・懸念はそのまま返す", () => {
    expect(sentimentOfFilter("期待")).toBe("期待");
    expect(sentimentOfFilter("懸念")).toBe("懸念");
  });

  it.each<[TopicFilter]>([
    ["all"],
    ["affected"],
    ["industry"],
    ["expert"],
    ["citizen"],
  ])("感情以外 %s は null", (filter) => {
    expect(sentimentOfFilter(filter)).toBeNull();
  });
});
