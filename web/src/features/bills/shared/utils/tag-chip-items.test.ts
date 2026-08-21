import { describe, expect, it } from "vitest";
import { countTagChipItems, toTagChipItems } from "./tag-chip-items";

const tag = (id: string) => ({ id, label: id });
const bill = (...tags: string[]) => ({ tags: tags.map(tag) });

describe("toTagChipItems", () => {
  it("グループの件数をそのまま出す", () => {
    const items = toTagChipItems([
      { tag: tag("暮らし"), bills: [1, 2, 3] },
      { tag: tag("税金"), bills: [1] },
    ]);

    expect(items).toEqual([
      { id: "暮らし", label: "暮らし", count: 3 },
      { id: "税金", label: "税金", count: 1 },
    ]);
  });

  // 選んでも何も出ないチップを並べる意味がない。
  it("0件のタグは落とす", () => {
    const items = toTagChipItems([
      { tag: tag("暮らし"), bills: [1] },
      { tag: tag("エネルギー"), bills: [] },
    ]);

    expect(items.map((i) => i.id)).toEqual(["暮らし"]);
  });

  it("渡した順を保つ", () => {
    const items = toTagChipItems([
      { tag: tag("c"), bills: [1] },
      { tag: tag("a"), bills: [1] },
      { tag: tag("b"), bills: [1] },
    ]);

    expect(items.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("空なら空", () => {
    expect(toTagChipItems([])).toEqual([]);
  });
});

describe("countTagChipItems", () => {
  it("渡した議案からタグごとに数える", () => {
    const items = countTagChipItems(
      [tag("暮らし"), tag("税金")],
      [bill("暮らし", "税金"), bill("税金"), bill("暮らし")]
    );

    expect(items).toEqual([
      { id: "暮らし", label: "暮らし", count: 2 },
      { id: "税金", label: "税金", count: 2 },
    ]);
  });

  it("渡したタグの順を保つ", () => {
    const items = countTagChipItems(
      [tag("c"), tag("a"), tag("b")],
      [bill("a", "b", "c")]
    );

    expect(items.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  // 運用途中のタグ（省庁名など）は法案に付いていても絞り込みには出さない。
  it("渡していないタグは議案に付いていても返さない", () => {
    const items = countTagChipItems([tag("税金")], [bill("税金", "財務省")]);

    expect(items.map((i) => i.id)).toEqual(["税金"]);
  });

  it("紐づく議案が無いタグは落とす", () => {
    const items = countTagChipItems(
      [tag("税金"), tag("エネルギー")],
      [bill("税金")]
    );

    expect(items.map((i) => i.id)).toEqual(["税金"]);
  });

  // 呼び出し側が他の絞り込みを適用した母集合を渡すので、空になることがある。
  it("議案が無ければ空", () => {
    expect(countTagChipItems([tag("税金")], [])).toEqual([]);
  });

  it("タグを渡さなければ空", () => {
    expect(countTagChipItems([], [bill("税金")])).toEqual([]);
  });

  // 消してしまうと、絞り込みが効いているのに何で絞られているのか
  // 画面から分からなくなる。
  it("選択中のタグは0件でも残す", () => {
    const items = countTagChipItems(
      [tag("税金"), tag("暮らし")],
      [bill("暮らし")],
      "税金"
    );

    expect(items).toEqual([
      { id: "税金", label: "税金", count: 0 },
      { id: "暮らし", label: "暮らし", count: 1 },
    ]);
  });

  it("選択中でないタグは0件なら落とす", () => {
    const items = countTagChipItems(
      [tag("税金"), tag("暮らし")],
      [bill("暮らし")],
      "暮らし"
    );

    expect(items.map((i) => i.id)).toEqual(["暮らし"]);
  });
});
