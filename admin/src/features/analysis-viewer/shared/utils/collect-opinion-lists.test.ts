import { describe, expect, it } from "vitest";
import type { ViewerBigTopic, ViewerOpinion } from "../types";
import {
  collectConcerns,
  collectGroundedOpinions,
  collectProposals,
  searchOpinions,
} from "./collect-opinion-lists";

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

function hierarchy(opinions: ViewerOpinion[]): ViewerBigTopic[] {
  return [
    {
      id: "big",
      title: "大トピック",
      description: "-",
      opinionCount: opinions.length,
      mediumTopics: [
        {
          id: "medium",
          title: "中トピック",
          description: "-",
          opinions,
        },
      ],
    },
  ];
}

describe("collectConcerns", () => {
  it("concern が入っている意見だけ返す", () => {
    const result = collectConcerns(
      hierarchy([
        opinion("a", { concern: "健康影響が心配" }),
        opinion("b"),
        opinion("c", { concern: "費用が読めない" }),
      ])
    );

    expect(result.map((o) => o.id)).toEqual(["a", "c"]);
  });

  it("richness 降順にする（null は最後尾）", () => {
    const result = collectConcerns(
      hierarchy([
        opinion("low", { concern: "x", richness: 10 }),
        opinion("none", { concern: "x", richness: null }),
        opinion("high", { concern: "x", richness: 90 }),
      ])
    );

    expect(result.map((o) => o.id)).toEqual(["high", "low", "none"]);
  });

  it("トピック名を添える", () => {
    const [first] = collectConcerns(
      hierarchy([opinion("a", { concern: "x" })])
    );

    expect(first.bigTopicTitle).toBe("大トピック");
    expect(first.mediumTopicTitle).toBe("中トピック");
  });
});

describe("collectProposals", () => {
  it("proposal が入っている意見だけ返す", () => {
    const result = collectProposals(
      hierarchy([
        opinion("a", { proposal: "基準を先に示してほしい" }),
        opinion("b", { concern: "心配" }),
      ])
    );

    expect(result.map((o) => o.id)).toEqual(["a"]);
  });
});

describe("collectGroundedOpinions", () => {
  it("根拠のない意見を除く", () => {
    const result = collectGroundedOpinions(
      hierarchy([
        opinion("expertise", {
          reasoningTypes: ["professional_expertise"],
        }),
        opinion("intuition", { reasoningTypes: ["intuition"] }),
        opinion("none", { reasoningTypes: ["none"] }),
      ])
    );

    expect(result.map((o) => o.id)).toEqual(["expertise"]);
  });

  // research_reference の誤検出を上位に固定しないため、根拠の種類では並べない。
  it("根拠の種類では並べ替えず richness 降順にする", () => {
    const result = collectGroundedOpinions(
      hierarchy([
        opinion("expertise", {
          reasoningTypes: ["professional_expertise"],
          richness: 90,
        }),
        opinion("overseas", {
          reasoningTypes: ["overseas_example"],
          richness: 50,
        }),
        opinion("research", {
          reasoningTypes: ["research_reference"],
          richness: 10,
        }),
      ])
    );

    expect(result.map((o) => o.id)).toEqual([
      "expertise",
      "overseas",
      "research",
    ]);
  });

  it("richness 降順に並べる", () => {
    const result = collectGroundedOpinions(
      hierarchy([
        opinion("low", {
          reasoningTypes: ["professional_expertise"],
          richness: 10,
        }),
        opinion("high", {
          reasoningTypes: ["professional_expertise"],
          richness: 80,
        }),
      ])
    );

    expect(result.map((o) => o.id)).toEqual(["high", "low"]);
  });

  it("複数の根拠を持つ意見も1件として扱う", () => {
    const result = collectGroundedOpinions(
      hierarchy([
        opinion("mixed", {
          reasoningTypes: ["professional_expertise", "research_reference"],
          richness: 20,
        }),
        opinion("expertise", {
          reasoningTypes: ["professional_expertise"],
          richness: 80,
        }),
      ])
    );

    expect(result.map((o) => o.id)).toEqual(["expertise", "mixed"]);
  });
});

describe("searchOpinions", () => {
  const topics = hierarchy([
    opinion("a", { title: "デジタル教科書の負担", content: "端末が重い" }),
    opinion("b", { concern: "通信環境が不安", content: "別の話" }),
    opinion("c", { contextualQuote: "（現場について）紙が良い" }),
  ]);

  it("タイトル・本文・引用・懸念を横断して部分一致する", () => {
    expect(searchOpinions(topics, "デジタル").map((o) => o.id)).toEqual(["a"]);
    expect(searchOpinions(topics, "端末").map((o) => o.id)).toEqual(["a"]);
    expect(searchOpinions(topics, "通信環境").map((o) => o.id)).toEqual(["b"]);
    expect(searchOpinions(topics, "紙が良い").map((o) => o.id)).toEqual(["c"]);
  });

  it("トピック名でも引ける", () => {
    expect(searchOpinions(topics, "中トピック")).toHaveLength(3);
  });

  it("大文字小文字を区別しない", () => {
    const withAscii = hierarchy([opinion("x", { content: "ICT support" })]);
    expect(searchOpinions(withAscii, "ict")).toHaveLength(1);
  });

  // 空クエリで全件出すと検索の意味がない。
  it("空クエリなら空配列", () => {
    expect(searchOpinions(topics, "")).toEqual([]);
    expect(searchOpinions(topics, "   ")).toEqual([]);
  });

  it("一致しなければ空配列", () => {
    expect(searchOpinions(topics, "存在しない語")).toEqual([]);
  });
});
