import { describe, expect, it } from "vitest";
import type { ViewerBigTopic, ViewerOpinion } from "../types";
import {
  buildMindmapGraph,
  findMediumTopic,
  MINDMAP_NODE_SIZE,
  MINDMAP_ROOT_ID,
  resolveSelectedNodeId,
} from "./build-mindmap-graph";

const BILL = "船荷証券の電子化に関する法律案";

function opinion(id: string): ViewerOpinion {
  return {
    id,
    title: `意見${id}`,
    content: `内容${id}`,
    contextualQuote: null,
    billSentiment: null,
    richness: null,
    concern: null,
    proposal: null,
    reasoningTypes: [],
    role: "general_citizen",
    roleTitle: null,
  };
}

function bigTopic(
  id: string,
  mediums: { id: string; opinions: string[] }[]
): ViewerBigTopic {
  const mediumTopics = mediums.map((m) => ({
    id: m.id,
    title: `medium-${m.id}`,
    description: `desc-${m.id}`,
    opinions: m.opinions.map(opinion),
  }));
  return {
    id,
    title: `big-${id}`,
    description: `desc-${id}`,
    mediumTopics,
    opinionCount: mediumTopics.reduce((sum, m) => sum + m.opinions.length, 0),
  };
}

describe("buildMindmapGraph", () => {
  it("議案を根に置き、大トピックと中トピックを枝にする（意見はノードにしない）", () => {
    const graph = buildMindmapGraph(
      [
        bigTopic("b1", [
          { id: "m1", opinions: ["a", "b"] },
          { id: "m2", opinions: ["c"] },
        ]),
      ],
      BILL
    );

    expect(graph.nodes.map((n) => n.data.kind)).toEqual([
      "root",
      "big",
      "medium",
      "medium",
    ]);
    expect(graph.nodes[0].data.title).toBe(BILL);
    expect(graph.nodes.map((n) => n.data.opinionCount)).toEqual([3, 3, 2, 1]);
  });

  it("根の件数は全大トピックの合計にする", () => {
    const graph = buildMindmapGraph(
      [
        bigTopic("b1", [{ id: "m1", opinions: ["a", "b"] }]),
        bigTopic("b2", [{ id: "m2", opinions: ["c"] }]),
      ],
      BILL
    );

    expect(graph.nodes[0].data.opinionCount).toBe(3);
  });

  it("根 → 大トピック → 中トピック にエッジを張る", () => {
    const graph = buildMindmapGraph(
      [bigTopic("b1", [{ id: "m1", opinions: ["a"] }])],
      BILL
    );

    expect(graph.edges).toEqual([
      {
        id: `${MINDMAP_ROOT_ID}->big:b1`,
        source: MINDMAP_ROOT_ID,
        target: "big:b1",
      },
      { id: "big:b1->medium:b1:m1", source: "big:b1", target: "medium:b1:m1" },
    ]);
  });

  // dagre はノードのラベルオブジェクトに座標を書き込むため、寸法の定数を
  // 共有して渡すと全ノードが同じ座標に潰れる。その回帰を防ぐ。
  it("大トピックが複数あっても縦に分離する", () => {
    const graph = buildMindmapGraph(
      [
        bigTopic("b1", [{ id: "m1", opinions: ["a"] }]),
        bigTopic("b2", [{ id: "m2", opinions: ["b"] }]),
        bigTopic("b3", [{ id: "m3", opinions: ["c"] }]),
      ],
      BILL
    );

    const bigYs = graph.nodes
      .filter((n) => n.data.kind === "big")
      .map((n) => n.position.y);
    expect(new Set(bigYs).size).toBe(3);
    const spread = Math.max(...bigYs) - Math.min(...bigYs);
    expect(spread).toBeGreaterThan(MINDMAP_NODE_SIZE.big.height);
  });

  // 中トピックが複数の大トピックに現れることは無いが、未分類の大トピックは
  // 合成 id を持つため、接頭辞なしだと id が衝突しうる。
  it("ノード id に大トピックを含めて衝突を防ぐ", () => {
    const graph = buildMindmapGraph(
      [
        bigTopic("b1", [{ id: "m1", opinions: ["a"] }]),
        bigTopic("ungrouped", [{ id: "m1", opinions: ["b"] }]),
      ],
      BILL
    );

    const ids = graph.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("左から右へ並べる（根 → 大 → 中）", () => {
    const graph = buildMindmapGraph(
      [bigTopic("b1", [{ id: "m1", opinions: ["a"] }])],
      BILL
    );

    const x = (kind: string) =>
      graph.nodes.find((n) => n.data.kind === kind)?.position.x ?? Number.NaN;
    expect(x("root")).toBeLessThan(x("big"));
    expect(x("big")).toBeLessThan(x("medium"));
  });

  it("座標は左上原点にする（dagre の中心座標をずらす）", () => {
    const graph = buildMindmapGraph(
      [bigTopic("b1", [{ id: "m1", opinions: ["a"] }])],
      BILL
    );

    expect(Math.min(...graph.nodes.map((n) => n.position.x))).toBe(0);
    expect(Math.min(...graph.nodes.map((n) => n.position.y))).toBe(0);
  });

  // 寸法が無いと初回の fitView が実寸を知らずに走り、1ノードだけ拡大して止まる。
  it("ノードに寸法を載せる", () => {
    const graph = buildMindmapGraph(
      [bigTopic("b1", [{ id: "m1", opinions: ["a"] }])],
      BILL
    );

    expect(graph.nodes.map((n) => [n.width, n.height])).toEqual([
      [MINDMAP_NODE_SIZE.root.width, MINDMAP_NODE_SIZE.root.height],
      [MINDMAP_NODE_SIZE.big.width, MINDMAP_NODE_SIZE.big.height],
      [MINDMAP_NODE_SIZE.medium.width, MINDMAP_NODE_SIZE.medium.height],
    ]);
  });

  it("同じ入力なら同じ座標を返す", () => {
    const topics = [
      bigTopic("b1", [
        { id: "m1", opinions: ["a"] },
        { id: "m2", opinions: ["b"] },
      ]),
      bigTopic("b2", [{ id: "m3", opinions: ["c"] }]),
    ];

    expect(buildMindmapGraph(topics, BILL)).toEqual(
      buildMindmapGraph(topics, BILL)
    );
  });

  it("中トピックを持たない大トピックも根から生やす", () => {
    const graph = buildMindmapGraph([bigTopic("b1", [])], BILL);

    expect(graph.nodes.map((n) => n.id)).toEqual([MINDMAP_ROOT_ID, "big:b1"]);
    expect(graph.edges).toHaveLength(1);
  });

  // 根だけが浮いたグラフを描かないため、トピックが無ければ何も返さない。
  it("トピックが無ければ空のグラフを返す", () => {
    expect(buildMindmapGraph([], BILL)).toEqual({ nodes: [], edges: [] });
  });
});

// キーボード（ノードにフォーカスして Enter / Space）でも選択は変わるため、
// パネルはクリックイベントではなく選択状態を入力にする。
describe("resolveSelectedNodeId", () => {
  it("選択中のノード id を返す", () => {
    expect(resolveSelectedNodeId([{ id: "medium:b1:m1" }])).toBe(
      "medium:b1:m1"
    );
  });

  it("選択が無ければ null を返す", () => {
    expect(resolveSelectedNodeId([])).toBeNull();
  });

  it("複数選択は先頭だけ採る", () => {
    expect(
      resolveSelectedNodeId([{ id: "medium:b1:m1" }, { id: "big:b2" }])
    ).toBe("medium:b1:m1");
  });
});

describe("findMediumTopic", () => {
  const topics = [
    bigTopic("b1", [{ id: "m1", opinions: ["a", "b"] }]),
    bigTopic("b2", [{ id: "m2", opinions: ["c"] }]),
  ];

  it("ノード id から中トピックと親を引く", () => {
    const found = findMediumTopic(topics, "medium:b2:m2");

    expect(found?.bigTopic.id).toBe("b2");
    expect(found?.mediumTopic.opinions.map((o) => o.id)).toEqual(["c"]);
  });

  it("大トピックや根のノード id では引かない", () => {
    expect(findMediumTopic(topics, "big:b1")).toBeNull();
    expect(findMediumTopic(topics, MINDMAP_ROOT_ID)).toBeNull();
  });

  it("null や未知の id では引かない", () => {
    expect(findMediumTopic(topics, null)).toBeNull();
    expect(findMediumTopic(topics, "medium:b1:unknown")).toBeNull();
  });
});
