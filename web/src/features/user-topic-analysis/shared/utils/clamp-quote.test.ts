import { describe, expect, it } from "vitest";
import { clampQuote, visualWidth } from "./clamp-quote";

describe("visualWidth", () => {
  it("全角は1文字ぶんとして数える", () => {
    expect(visualWidth("宇宙開発")).toBe(4);
  });

  it("大文字は小文字より広く数える", () => {
    // Noto Serif JP の実測: A-Z 平均 0.714 / a-z 平均 0.573
    expect(visualWidth("W")).toBeGreaterThan(visualWidth("w"));
  });

  it("半角英数字は全角より狭く数える", () => {
    expect(visualWidth("SpaceX")).toBeLessThan(visualWidth("スペースエックス"));
    expect(visualWidth("SpaceX")).toBeCloseTo(0.75 + 0.6 * 4 + 0.75);
  });

  it("記号と空白はいちばん狭く数える", () => {
    expect(visualWidth(".")).toBeLessThan(visualWidth("a"));
  });

  it("半角カナは半文字ぶんとして数える", () => {
    expect(visualWidth("ﾛｹｯﾄ")).toBe(2);
  });

  it("空文字は0", () => {
    expect(visualWidth("")).toBe(0);
  });
});

describe("clampQuote", () => {
  // capacity 60 / 肩書「市民」のとき、本文に使える幅は
  // 60 - (2+2)*11/14 - 1 = 55.857… なので全角55文字まで入る。
  const NARROW = 60;

  it("収まる引用はそのまま返す", () => {
    const result = clampQuote("短い意見です", "市民", NARROW);

    expect(result).toEqual({ text: "短い意見です", truncated: false });
  });

  it("収まらない引用は予算いっぱいまで切り詰める", () => {
    const result = clampQuote("あ".repeat(200), "市民", NARROW);

    expect(result).toEqual({ text: "あ".repeat(55), truncated: true });
  });

  // 切り詰めずに収まる上限は 60 - 3.142… = 56.857… なので全角56文字。
  // 切り詰めると「…」ぶんが引かれて55文字になる。
  it("ちょうど収まる引用は切り詰めない", () => {
    const result = clampQuote("あ".repeat(56), "市民", NARROW);

    expect(result).toEqual({ text: "あ".repeat(56), truncated: false });
  });

  it("1文字だけ溢れる引用は切り詰める", () => {
    const result = clampQuote("あ".repeat(57), "市民", NARROW);

    expect(result).toEqual({ text: "あ".repeat(55), truncated: true });
  });

  it("肩書が長いほど本文が短くなる", () => {
    // 「衛星研究者」は 5 文字なので (5+2)*11/14 = 5.5 → 本文は 53 文字まで
    const result = clampQuote("あ".repeat(200), "衛星研究者", NARROW);

    expect(result).toEqual({ text: "あ".repeat(53), truncated: true });
  });

  it("半角が混ざる引用は全角だけの引用より多く入る", () => {
    const halfWidth = clampQuote("a".repeat(200), "市民", NARROW);
    const fullWidth = clampQuote("あ".repeat(200), "市民", NARROW);

    expect(halfWidth.text.length).toBeGreaterThan(fullWidth.text.length);
  });

  it("capacity が広ければ切り詰めない", () => {
    const quote = "あ".repeat(100);

    expect(clampQuote(quote, "市民", 154).truncated).toBe(false);
  });

  it("肩書だけで capacity を使い切ったら本文は空になる", () => {
    const result = clampQuote("あ".repeat(50), "あ".repeat(100), 10);

    expect(result).toEqual({ text: "", truncated: true });
  });

  it("空の引用は capacity が足りなくても切り詰め扱いにしない", () => {
    // 「…（市民）」だけが並ぶ表示にならないこと
    expect(clampQuote("", "市民", 3)).toEqual({ text: "", truncated: false });
  });

  it("空の引用はそのまま返す", () => {
    expect(clampQuote("", "市民", NARROW)).toEqual({
      text: "",
      truncated: false,
    });
  });

  it("サロゲートペアを途中で割らない", () => {
    // 予算の切れ目(全角55文字)にちょうどサロゲートペアが来る引用。
    // UTF-16のコード単位で切る実装に退行すると、壊れた文字が末尾に残る。
    const result = clampQuote(
      `${"あ".repeat(55)}𠮷${"あ".repeat(50)}`,
      "市民",
      NARROW
    );

    expect(result.text).toBe("あ".repeat(55));
    expect([...result.text]).toHaveLength(55);
  });
});
