import { describe, expect, it } from "vitest";
import {
  getDisplayableSupplements,
  getNewFormatReason,
  hasNewFormatReason,
  normalizeReasonPoints,
  normalizeStanceSupplements,
  parseStanceSupplements,
} from "./reason-format";

describe("hasNewFormatReason", () => {
  it("判断の理由（一言）があれば true", () => {
    expect(
      hasNewFormatReason({ reason_summary: "理由", reason_points: [] })
    ).toBe(true);
  });

  it("箇条書きだけでも true", () => {
    expect(
      hasNewFormatReason({ reason_summary: null, reason_points: ["根拠"] })
    ).toBe(true);
  });

  it("どちらも未入力（空白のみを含む）なら false", () => {
    expect(
      hasNewFormatReason({ reason_summary: "  ", reason_points: ["", " "] })
    ).toBe(false);
    expect(hasNewFormatReason({ reason_summary: null, reason_points: [] })).toBe(
      false
    );
  });
});

describe("getNewFormatReason", () => {
  it("一言と箇条書きを整形して返す", () => {
    expect(
      getNewFormatReason({
        reason_summary: " 一言 ",
        reason_points: [" 根拠1 ", "", "根拠2"],
      })
    ).toEqual({ summary: "一言", points: ["根拠1", "根拠2"] });
  });

  it("どちらも空なら null を返す", () => {
    expect(
      getNewFormatReason({ reason_summary: " ", reason_points: [" "] })
    ).toBeNull();
  });

  it("カラムが存在しない（マイグレーション前のキャッシュ）場合は null を返す", () => {
    expect(getNewFormatReason({})).toBeNull();
  });
});

describe("parseStanceSupplements", () => {
  it("title / body を持つ配列をそのまま返す", () => {
    expect(
      parseStanceSupplements([{ title: "見出し", body: "本文" }])
    ).toEqual([{ title: "見出し", body: "本文" }]);
  });

  it("欠けたフィールドは空文字で補い、オブジェクト以外は読み飛ばす", () => {
    expect(
      parseStanceSupplements([{ title: "見出しのみ" }, "文字列", null, 1])
    ).toEqual([{ title: "見出しのみ", body: "" }]);
  });

  it("配列でなければ空配列を返す", () => {
    expect(parseStanceSupplements(null)).toEqual([]);
    expect(parseStanceSupplements({ title: "x" })).toEqual([]);
  });
});

describe("normalizeStanceSupplements", () => {
  it("前後の空白を除き、見出し・本文ともに空のものを取り除く", () => {
    expect(
      normalizeStanceSupplements([
        { title: " 見出し ", body: " 本文\n" },
        { title: "", body: "  " },
        { title: "見出しのみ", body: "" },
      ])
    ).toEqual([
      { title: "見出し", body: "本文" },
      { title: "見出しのみ", body: "" },
    ]);
  });
});

describe("normalizeReasonPoints", () => {
  it("前後の空白を除き、空の項目を取り除く", () => {
    expect(normalizeReasonPoints([" 1つ目 ", "", "  ", "2つ目"])).toEqual([
      "1つ目",
      "2つ目",
    ]);
  });
});

describe("getDisplayableSupplements", () => {
  it("本文が空の補足情報を除いて返す", () => {
    expect(
      getDisplayableSupplements([
        { title: "今回の判断の範囲", body: "本文" },
        { title: "各議員の判断", body: "  " },
      ])
    ).toEqual([{ title: "今回の判断の範囲", body: "本文" }]);
  });

  it("不正な値は空配列を返す", () => {
    expect(getDisplayableSupplements(undefined)).toEqual([]);
  });
});
