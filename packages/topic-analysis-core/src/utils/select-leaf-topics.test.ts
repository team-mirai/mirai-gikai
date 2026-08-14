import { describe, expect, it } from "vitest";
import { hasLinkedOpinion, selectLeafTopics } from "./select-leaf-topics";

const topic = (id: string, opinionCount: number) => ({
  id,
  topic_opinion: Array.from({ length: opinionCount }, () => ({})),
});

describe("selectLeafTopics", () => {
  it("意見が付いたトピックだけを返す", () => {
    const result = selectLeafTopics(
      [topic("big", 0), topic("mediumA", 2), topic("mediumB", 1)],
      hasLinkedOpinion
    );

    expect(result.map((t) => t.id)).toEqual(["mediumA", "mediumB"]);
  });

  // 大トピックは意見を直接持たないので、この規則だけで落ちる。
  it("大トピック（意見0件）を除く", () => {
    const result = selectLeafTopics([topic("big", 0)], hasLinkedOpinion);
    expect(result).toEqual([]);
  });

  // 子を全部削除された親は「子なし」になるが意見も0件なので葉に昇格しない。
  // 子の有無で判定していると、ここで領域見出しが割当先候補に戻ってしまう。
  it("子を失った大トピックを葉に昇格させない", () => {
    const orphanedParent = topic("big", 0);
    const result = selectLeafTopics([orphanedParent], hasLinkedOpinion);

    expect(result).toEqual([]);
  });

  it("2階層化以前のフラットなデータも意見の有無で判定する", () => {
    const result = selectLeafTopics(
      [topic("旧A", 3), topic("旧B", 1)],
      hasLinkedOpinion
    );

    expect(result.map((t) => t.id)).toEqual(["旧A", "旧B"]);
  });

  it("入力順を保つ", () => {
    const result = selectLeafTopics(
      [topic("m1", 1), topic("big", 0), topic("m2", 1)],
      hasLinkedOpinion
    );

    expect(result.map((t) => t.id)).toEqual(["m1", "m2"]);
  });

  it("空配列なら空配列", () => {
    expect(selectLeafTopics([], hasLinkedOpinion)).toEqual([]);
  });
});

describe("hasLinkedOpinion", () => {
  it("topic_opinion が空なら false", () => {
    expect(hasLinkedOpinion({ topic_opinion: [] })).toBe(false);
  });

  it("topic_opinion が未定義・null でも壊れない", () => {
    expect(hasLinkedOpinion({})).toBe(false);
    expect(hasLinkedOpinion({ topic_opinion: null })).toBe(false);
  });

  it("1件以上あれば true", () => {
    expect(hasLinkedOpinion({ topic_opinion: [{}] })).toBe(true);
  });
});
