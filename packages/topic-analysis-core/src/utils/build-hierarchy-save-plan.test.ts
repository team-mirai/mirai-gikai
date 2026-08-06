import { describe, expect, it } from "vitest";
import type { FinalTopicWithId } from "../shared/types";
import {
  buildHierarchySavePlan,
  countAssignmentsByLocalId,
} from "./build-hierarchy-save-plan";
import type { TopicHierarchy } from "./build-topic-hierarchy";

const medium = (localId: string): FinalTopicWithId => ({
  local_id: localId,
  title: `${localId} の主張`,
  description: `${localId} の説明`,
});

const hierarchy: TopicHierarchy[] = [
  {
    big: { title: "権限", description: "権限の話" },
    children: [medium("tA"), medium("tB")],
    isOther: false,
  },
  {
    big: { title: "予算", description: "予算の話" },
    children: [medium("tC")],
    isOther: false,
  },
];

describe("buildHierarchySavePlan", () => {
  it("大トピック → 配下の中トピック の深さ優先で並べる", () => {
    const { topics } = buildHierarchySavePlan(hierarchy, []);

    expect(topics.map((t) => [t.sort_order, t.title])).toEqual([
      [0, "権限"],
      [1, "tA の主張"],
      [2, "tB の主張"],
      [3, "予算"],
      [4, "tC の主張"],
    ]);
  });

  it("中トピックに親の sort_order を持たせる", () => {
    const { topics } = buildHierarchySavePlan(hierarchy, []);

    expect(topics.map((t) => t.parent_sort_order)).toEqual([
      null,
      0,
      0,
      null,
      3,
    ]);
  });

  // 大トピックに意見を直接紐づけると親子で二重計上される。
  it("意見は葉（中トピック）にだけ紐づく", () => {
    const { pairs } = buildHierarchySavePlan(hierarchy, [
      { opinion_id: "o1", topic_local_id: "tA" },
      { opinion_id: "o2", topic_local_id: "tC" },
    ]);

    expect(pairs).toEqual([
      { opinion_id: "o1", topic_index: 1 },
      { opinion_id: "o2", topic_index: 4 },
    ]);
  });

  it("未割当の意見は紐付けを作らない", () => {
    const { pairs } = buildHierarchySavePlan(hierarchy, [
      { opinion_id: "o1", topic_local_id: null },
    ]);

    expect(pairs).toEqual([]);
  });

  it("階層に存在しない local_id への割当は捨てる", () => {
    const { pairs } = buildHierarchySavePlan(hierarchy, [
      { opinion_id: "o1", topic_local_id: "tZZZ" },
    ]);

    expect(pairs).toEqual([]);
  });

  it("空の階層なら何も作らない", () => {
    expect(buildHierarchySavePlan([], [])).toEqual({ topics: [], pairs: [] });
  });
});

describe("countAssignmentsByLocalId", () => {
  it("local_id ごとに件数を数える", () => {
    const counts = countAssignmentsByLocalId([
      { opinion_id: "o1", topic_local_id: "tA" },
      { opinion_id: "o2", topic_local_id: "tA" },
      { opinion_id: "o3", topic_local_id: "tB" },
    ]);

    expect(counts.get("tA")).toBe(2);
    expect(counts.get("tB")).toBe(1);
  });

  it("未割当は数えない", () => {
    const counts = countAssignmentsByLocalId([
      { opinion_id: "o1", topic_local_id: null },
    ]);

    expect(counts.size).toBe(0);
  });
});

describe("buildHierarchySavePlan（親なしのフラット階層）", () => {
  const flat = [
    { big: null, children: [medium("tA"), medium("tB")], isOther: false },
  ];

  it("big が null なら親行を作らない", () => {
    const { topics } = buildHierarchySavePlan(flat, []);

    expect(topics.map((t) => [t.sort_order, t.title])).toEqual([
      [0, "tA の主張"],
      [1, "tB の主張"],
    ]);
    expect(topics.every((t) => t.parent_sort_order === null)).toBe(true);
  });

  it("意見はそのままトップレベルのトピックに紐づく", () => {
    const { pairs } = buildHierarchySavePlan(flat, [
      { opinion_id: "o1", topic_local_id: "tB" },
    ]);

    expect(pairs).toEqual([{ opinion_id: "o1", topic_index: 1 }]);
  });
});
