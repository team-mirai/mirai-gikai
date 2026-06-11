import { describe, expect, it } from "vitest";
import { buildSortedTopicsAndPairs } from "./build-sorted-topics";

const topics = [
  { local_id: "t0", title: "A", description: "descA" },
  { local_id: "t1", title: "B", description: "descB" },
  { local_id: "t2", title: "C", description: "descC" },
];

describe("buildSortedTopicsAndPairs", () => {
  it("opinion 件数降順に並べ替える", () => {
    const assignments = [
      { opinion_id: "o1", topic_local_id: "t1" },
      { opinion_id: "o2", topic_local_id: "t1" },
      { opinion_id: "o3", topic_local_id: "t0" },
      { opinion_id: "o4", topic_local_id: "t1" },
      { opinion_id: "o5", topic_local_id: "t0" },
    ];
    const { sortedTopics, pairs } = buildSortedTopicsAndPairs(
      topics,
      assignments
    );
    // t1(3件) → t0(2件) の順
    expect(sortedTopics.map((t) => t.title)).toEqual(["B", "A"]);
    // pairs の topic_index は並べ替え後（B=0, A=1）
    expect(pairs.filter((p) => p.topic_index === 0)).toHaveLength(3);
    expect(pairs.filter((p) => p.topic_index === 1)).toHaveLength(2);
  });

  it("0件のトピックは除外する", () => {
    const assignments = [{ opinion_id: "o1", topic_local_id: "t0" }];
    const { sortedTopics } = buildSortedTopicsAndPairs(topics, assignments);
    expect(sortedTopics.map((t) => t.title)).toEqual(["A"]);
  });

  it("未分類（null）はペアを作らない", () => {
    const assignments = [
      { opinion_id: "o1", topic_local_id: null },
      { opinion_id: "o2", topic_local_id: "t0" },
    ];
    const { pairs } = buildSortedTopicsAndPairs(topics, assignments);
    expect(pairs).toEqual([{ opinion_id: "o2", topic_index: 0 }]);
  });

  it("全件未分類なら空", () => {
    const { sortedTopics, pairs } = buildSortedTopicsAndPairs(topics, [
      { opinion_id: "o1", topic_local_id: null },
    ]);
    expect(sortedTopics).toEqual([]);
    expect(pairs).toEqual([]);
  });
});
