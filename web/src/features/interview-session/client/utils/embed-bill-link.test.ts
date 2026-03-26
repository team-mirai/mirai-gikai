import { describe, expect, it } from "vitest";
import { embedBillLink } from "./embed-bill-link";

describe("embedBillLink", () => {
  const billTitle = "子ども医療費助成条例";
  const link = "/bills/123";

  it("「」括弧付きの法案名をリンクに変換する", () => {
    const text =
      "こんにちは！今日は「子ども医療費助成条例」についてお聞きします。";
    const result = embedBillLink(text, billTitle, link);
    expect(result).toBe(
      "こんにちは！今日は「[子ども医療費助成条例](/bills/123)」についてお聞きします。"
    );
  });

  it("括弧なしの法案名をリンクに変換する", () => {
    const text = "こんにちは！子ども医療費助成条例についてお聞きします。";
    const result = embedBillLink(text, billTitle, link);
    expect(result).toBe(
      "こんにちは！[子ども医療費助成条例](/bills/123)についてお聞きします。"
    );
  });

  it("最初の出現のみ置換する", () => {
    const text =
      "「子ども医療費助成条例」は重要です。子ども医療費助成条例について議論しましょう。";
    const result = embedBillLink(text, billTitle, link);
    expect(result).toBe(
      "「[子ども医療費助成条例](/bills/123)」は重要です。子ども医療費助成条例について議論しましょう。"
    );
  });

  it("法案名が含まれない場合はテキストをそのまま返す", () => {
    const text = "こんにちは！今日のインタビューを始めましょう。";
    const result = embedBillLink(text, billTitle, link);
    expect(result).toBe(text);
  });

  it("previewToken付きのリンクも正しく埋め込む", () => {
    const previewLink = "/preview/abc123/bills/456";
    const text = "「子ども医療費助成条例」についてのインタビューです。";
    const result = embedBillLink(text, billTitle, previewLink);
    expect(result).toBe(
      "「[子ども医療費助成条例](/preview/abc123/bills/456)」についてのインタビューです。"
    );
  });
});
