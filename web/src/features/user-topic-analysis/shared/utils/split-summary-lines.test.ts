import { describe, expect, it } from "vitest";
import { splitSummaryLines } from "./split-summary-lines";

describe("splitSummaryLines", () => {
  it("改行区切りの3行を配列に分解する", () => {
    const input =
      "防災大臣の勧告権に強制力がなく、実効性を懸念する声がある。\n大規模災害時には省庁間調整が機能しないリスクが指摘されている。\n勧告レベルや対応基準の事前明確化を求める意見がある。";
    expect(splitSummaryLines(input)).toEqual([
      "防災大臣の勧告権に強制力がなく、実効性を懸念する声がある。",
      "大規模災害時には省庁間調整が機能しないリスクが指摘されている。",
      "勧告レベルや対応基準の事前明確化を求める意見がある。",
    ]);
  });

  it("先頭の箇条書き記号（・ ･ • と「- 」）を除去する", () => {
    expect(splitSummaryLines("・要点1\n• 要点2\n- 要点3")).toEqual([
      "要点1",
      "要点2",
      "要点3",
    ]);
  });

  it("本文先頭のハイフン（スペースなし）は残す", () => {
    expect(splitSummaryLines("-20%の歳出削減を求める意見がある。")).toEqual([
      "-20%の歳出削減を求める意見がある。",
    ]);
  });

  it("空行を除去する", () => {
    expect(splitSummaryLines("行1\n\n行2\n  \n")).toEqual(["行1", "行2"]);
  });

  it("改行を含まない平文は1要素として返す", () => {
    expect(splitSummaryLines("単一の説明文。")).toEqual(["単一の説明文。"]);
  });

  it("空文字は空配列を返す", () => {
    expect(splitSummaryLines("")).toEqual([]);
  });
});
