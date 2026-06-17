import { describe, expect, it } from "vitest";
import type { TargetOpinion } from "../shared/types";
import {
  buildIncrementalPlan,
  selectUnextractedOpinions,
  toExistingTopics,
} from "./incremental";

function op(id: string, extractedAt: string | null): TargetOpinion {
  return {
    opinion_id: id,
    interview_report_id: `r-${id}`,
    opinion_index: 0,
    title: `t-${id}`,
    content: `c-${id}`,
    contextual_quote: null,
    bill_sentiment: null,
    role: null,
    richness: null,
    topic_extracted_at: extractedAt,
  };
}

describe("toExistingTopics", () => {
  it("topic_opinion から割当意見IDを抽出する", () => {
    const rows = [
      {
        title: "T1",
        description: "D1",
        topic_opinion: [
          { interview_opinion: { id: "o1" } },
          { interview_opinion: { id: "o2" } },
          { interview_opinion: null },
          null,
        ],
      },
      { title: "T2", description: "D2", topic_opinion: null },
    ];
    expect(toExistingTopics(rows)).toEqual([
      { title: "T1", description: "D1", opinion_ids: ["o1", "o2"] },
      { title: "T2", description: "D2", opinion_ids: [] },
    ]);
  });
});

describe("selectUnextractedOpinions", () => {
  it("topic_extracted_at が null の意見だけ返す", () => {
    const opinions = [op("a", null), op("b", "2026-01-01T00:00:00Z"), op("c", null)];
    expect(selectUnextractedOpinions(opinions).map((o) => o.opinion_id)).toEqual(
      ["a", "c"]
    );
  });
});

describe("buildIncrementalPlan", () => {
  it("既存にe・新規にnのlocal_idを振り、既存割当を引き継ぎ、未割当を返す", () => {
    const existing = [
      { title: "既存1", description: "d1", opinion_ids: ["o1", "o2"] },
      { title: "既存2", description: "d2", opinion_ids: ["o3"] },
    ];
    const acceptedNew = [{ title: "新規1", description: "n1" }];
    const allTargets = [
      op("o1", "x"),
      op("o2", "x"),
      op("o3", "x"),
      op("o4", null), // 新規・未割当
      op("o5", null), // 新規・未割当
    ];

    const plan = buildIncrementalPlan(existing, acceptedNew, allTargets);

    expect(plan.finalTopics).toEqual([
      { title: "既存1", description: "d1", local_id: "e0" },
      { title: "既存2", description: "d2", local_id: "e1" },
      { title: "新規1", description: "n1", local_id: "n0" },
    ]);
    expect(plan.carriedAssignments).toEqual([
      { opinion_id: "o1", topic_local_id: "e0" },
      { opinion_id: "o2", topic_local_id: "e0" },
      { opinion_id: "o3", topic_local_id: "e1" },
    ]);
    expect(plan.unassignedOpinions.map((o) => o.opinion_id)).toEqual([
      "o4",
      "o5",
    ]);
  });

  it("対象外になった意見(allTargetsに無い)は引き継がない", () => {
    const existing = [
      { title: "A", description: "a", opinion_ids: ["o1", "o2"] },
    ];
    // o2 は対象外（allTargets に無い）→ 引き継がない
    const plan = buildIncrementalPlan(existing, [], [op("o1", "x")]);
    expect(plan.carriedAssignments).toEqual([
      { opinion_id: "o1", topic_local_id: "e0" },
    ]);
    expect(plan.unassignedOpinions).toEqual([]);
  });

  it("意見の重複割当は1件に正規化する", () => {
    const existing = [
      { title: "A", description: "a", opinion_ids: ["o1"] },
      { title: "B", description: "b", opinion_ids: ["o1"] },
    ];
    const plan = buildIncrementalPlan(existing, [], [op("o1", "x")]);
    expect(plan.carriedAssignments).toEqual([
      { opinion_id: "o1", topic_local_id: "e0" },
    ]);
    expect(plan.unassignedOpinions).toEqual([]);
  });
});
