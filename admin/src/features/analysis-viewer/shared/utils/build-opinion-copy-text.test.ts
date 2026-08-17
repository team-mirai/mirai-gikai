import { describe, expect, it } from "vitest";
import type { FlatOpinion } from "../types";
import { buildOpinionCopyText } from "./build-opinion-copy-text";

function opinion(overrides: Partial<FlatOpinion> = {}): FlatOpinion {
  return {
    id: "o1",
    title: "紙の船荷証券の処理に膨大な時間がかかっている",
    content: "国際郵便での送付に5〜7営業日かかる。",
    contextualQuote: null,
    billSentiment: null,
    richness: null,
    concern: null,
    proposal: null,
    reasoningTypes: [],
    role: "subject_expert",
    roleTitle: "フォワーダー",
    sessionId: "s1",
    configId: "c1",
    bigTopicTitle: "物流効率化と事業経済効果",
    mediumTopicTitle: "紙のB/L送付遅延",
    ...overrides,
  };
}

const context = {
  billName: "船荷証券の電子化に関する法律案",
  reportUrl: (o: FlatOpinion) =>
    o.sessionId && o.configId
      ? `https://admin.example/bills/b1/interview/${o.configId}/reports/${o.sessionId}`
      : null,
};

describe("buildOpinionCopyText", () => {
  it("議案名と件数の見出しを先頭に置く", () => {
    const text = buildOpinionCopyText(
      [opinion(), opinion({ id: "o2" })],
      context
    );

    expect(text.split("\n")[0]).toBe(
      "## 船荷証券の電子化に関する法律案 意見抜粋（2件）"
    );
  });

  it("立場・論点・発言・URL を子項目に並べる", () => {
    const text = buildOpinionCopyText([opinion()], context);

    expect(text).toContain(
      "- **紙の船荷証券の処理に膨大な時間がかかっている**"
    );
    expect(text).toContain("  - 立場: フォワーダー（専門的な有識者）");
    expect(text).toContain(
      "  - 論点: 物流効率化と事業経済効果 › 紙のB/L送付遅延"
    );
    expect(text).toContain("  - 発言: 国際郵便での送付に5〜7営業日かかる。");
    expect(text).toContain(
      "  - https://admin.example/bills/b1/interview/c1/reports/s1"
    );
  });

  // Markdown の箇条書きは改行で切れる。発言原文は複数行になりうる。
  it("発言原文の改行と連続空白を1行に畳む", () => {
    const text = buildOpinionCopyText(
      [
        opinion({
          contextualQuote:
            "現在、紙のB/Lは国際郵便で送付する。\n\n滞留が起きる。",
        }),
      ],
      context
    );

    expect(text).toContain(
      "  - 発言: 現在、紙のB/Lは国際郵便で送付する。 滞留が起きる。"
    );
    expect(
      text.split("\n").filter((l) => l.startsWith("  - 発言:"))
    ).toHaveLength(1);
  });

  it("引用があれば本文より引用を優先する", () => {
    const text = buildOpinionCopyText(
      [opinion({ contextualQuote: "引用のほう" })],
      context
    );

    expect(text).toContain("  - 発言: 引用のほう");
    expect(text).not.toContain("国際郵便での送付に5〜7営業日かかる。");
  });

  it("懸念と提案があれば入れる", () => {
    const text = buildOpinionCopyText(
      [opinion({ concern: "コストが上がる", proposal: "補助金を出す" })],
      context
    );

    expect(text).toContain("  - 懸念: コストが上がる");
    expect(text).toContain("  - 提案: 補助金を出す");
  });

  it("懸念と提案が無ければ行を作らない", () => {
    const text = buildOpinionCopyText([opinion()], context);

    expect(text).not.toContain("懸念:");
    expect(text).not.toContain("提案:");
  });

  // レポートを辿れない意見でも、他の情報は落とさず出す。
  it("URL を作れない意見では URL 行を省く", () => {
    const text = buildOpinionCopyText(
      [opinion({ sessionId: null, configId: null })],
      context
    );

    expect(text).toContain("  - 立場: フォワーダー（専門的な有識者）");
    expect(text).not.toContain("https://");
  });

  it("肩書が無ければ立場の区分だけを出す", () => {
    const text = buildOpinionCopyText([opinion({ roleTitle: null })], context);

    expect(text).toContain("  - 立場: 専門的な有識者");
  });

  it("立場が引けなければ立場の行を作らない", () => {
    const text = buildOpinionCopyText(
      [opinion({ role: null, roleTitle: null })],
      context
    );

    expect(text).not.toContain("立場:");
  });

  it("選択が無ければ空文字を返す", () => {
    expect(buildOpinionCopyText([], context)).toBe("");
  });
});
