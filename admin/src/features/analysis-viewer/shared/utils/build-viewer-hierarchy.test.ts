import { describe, expect, it } from "vitest";
import type { RawViewerTopic, ViewerOpinion } from "../types";
import {
  buildViewerHierarchy,
  flattenOpinions,
  UNGROUPED_BIG_TOPIC_TITLE,
} from "./build-viewer-hierarchy";

function opinion(
  id: string,
  overrides: Partial<ViewerOpinion> = {}
): ViewerOpinion {
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
    ...overrides,
  };
}

function topic(
  id: string,
  parentTopicId: string | null,
  opinions: ViewerOpinion[] = []
): RawViewerTopic {
  return {
    id,
    title: `topic-${id}`,
    description: `desc-${id}`,
    parent_topic_id: parentTopicId,
    opinions,
  };
}

describe("buildViewerHierarchy", () => {
  it("大トピック配下に中トピックを並べ、件数は配下の合計にする", () => {
    const result = buildViewerHierarchy(
      [
        topic("big", null),
        topic("m1", "big", [opinion("a"), opinion("b")]),
        topic("m2", "big", [opinion("c")]),
      ],
      "all"
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("big");
    expect(result[0].opinionCount).toBe(3);
    expect(result[0].mediumTopics.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("大トピックも中トピックも件数降順にする", () => {
    const result = buildViewerHierarchy(
      [
        topic("bigSmall", null),
        topic("s1", "bigSmall", [opinion("a")]),
        topic("bigLarge", null),
        topic("l1", "bigLarge", [opinion("b")]),
        topic("l2", "bigLarge", [opinion("c"), opinion("d")]),
      ],
      "all"
    );

    expect(result.map((b) => b.id)).toEqual(["bigLarge", "bigSmall"]);
    expect(result[0].mediumTopics.map((m) => m.id)).toEqual(["l2", "l1"]);
  });

  // 2階層化以前の version や、グルーピングがフラットに倒れた version。
  it("親を持たない葉は「グループ未分類」にまとめる", () => {
    const result = buildViewerHierarchy(
      [
        topic("flat1", null, [opinion("a")]),
        topic("flat2", null, [opinion("b")]),
      ],
      "all"
    );

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe(UNGROUPED_BIG_TOPIC_TITLE);
    expect(result[0].mediumTopics).toHaveLength(2);
  });

  it("大トピックと未分類の葉が混在しても両方出す", () => {
    const result = buildViewerHierarchy(
      [
        topic("big", null),
        topic("m1", "big", [opinion("a"), opinion("b"), opinion("c")]),
        topic("flat", null, [opinion("d")]),
      ],
      "all"
    );

    expect(result.map((b) => b.title)).toEqual([
      "topic-big",
      UNGROUPED_BIG_TOPIC_TITLE,
    ]);
  });

  describe("audience の絞り込み", () => {
    const topics = [
      topic("big", null),
      topic("m1", "big", [
        opinion("citizen", { role: "general_citizen" }),
        opinion("expert", { role: "subject_expert" }),
      ]),
      topic("m2", "big", [
        opinion("onlyCitizen", {
          role: "general_citizen",
          reasoningTypes: ["intuition"],
        }),
      ]),
    ];

    it("all は絞らない", () => {
      const result = buildViewerHierarchy(topics, "all");
      expect(result[0].opinionCount).toBe(3);
      expect(result[0].mediumTopics).toHaveLength(2);
    });

    // 絞った結果0件になった中トピックはカードごと消す。
    it("experts で0件になった中トピックを落とす", () => {
      const result = buildViewerHierarchy(topics, "experts");
      expect(result[0].mediumTopics.map((m) => m.id)).toEqual(["m1"]);
      expect(result[0].opinionCount).toBe(1);
    });

    it("中トピックが全部消えたら大トピックも出さない", () => {
      const result = buildViewerHierarchy(
        [
          topic("big", null),
          topic("m1", "big", [opinion("a", { role: "general_citizen" })]),
        ],
        "experts"
      );
      expect(result).toEqual([]);
    });

    // 肩書が一般市民でも専門知識を根拠にしていれば specialists に入る。
    it("specialists は発言の根拠で拾う", () => {
      const result = buildViewerHierarchy(
        [
          topic("big", null),
          topic("m1", "big", [
            opinion("a", {
              role: "general_citizen",
              reasoningTypes: ["professional_expertise"],
            }),
            opinion("b", { role: "general_citizen" }),
          ]),
        ],
        "specialists"
      );

      expect(result[0].mediumTopics[0].opinions.map((o) => o.id)).toEqual([
        "a",
      ]);
    });
  });

  it("トピックが無ければ空を返す", () => {
    expect(buildViewerHierarchy([], "all")).toEqual([]);
  });
});

describe("flattenOpinions", () => {
  it("大・中トピック名を添えて平坦化する", () => {
    const hierarchy = buildViewerHierarchy(
      [topic("big", null), topic("m1", "big", [opinion("a")])],
      "all"
    );

    expect(flattenOpinions(hierarchy)).toEqual([
      expect.objectContaining({
        id: "a",
        bigTopicTitle: "topic-big",
        mediumTopicTitle: "topic-m1",
      }),
    ]);
  });

  it("空の階層なら空配列", () => {
    expect(flattenOpinions([])).toEqual([]);
  });

  // 意見は topic_opinion の主キー (version_id, opinion_id) により version 内で
  // 1トピックにしか紐づかない。加えて未分類への回収も経路が重ならないので、
  // 親直付け・3階層が混ざっても id は一意になる（React の key に使える）。
  it("親直付けと3階層が混ざっても id は重複せず、意見も落ちない", () => {
    const hierarchy = buildViewerHierarchy(
      [
        topic("big", null, [opinion("direct")]),
        topic("mid", "big", [opinion("a")]),
        topic("deep", "mid", [opinion("b")]),
        topic("flat", null, [opinion("c")]),
      ],
      "all"
    );

    const ids = flattenOpinions(hierarchy).map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(["a", "b", "c", "direct"]);
  });
});
