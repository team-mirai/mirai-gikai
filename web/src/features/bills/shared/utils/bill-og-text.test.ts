import { describe, expect, it } from "vitest";
import { buildBillOgText } from "./bill-og-text";

describe("buildBillOgText", () => {
  it("通常版は議案名と要約をそのまま使う", () => {
    expect(
      buildBillOgText({ name: "テスト法案", article_kind: "standard" }, "要約")
    ).toEqual({ title: "テスト法案", description: "要約" });
  });

  it("通常版で要約がなければ既定の説明文にする", () => {
    expect(
      buildBillOgText({ name: "テスト法案", article_kind: "standard" }, null)
    ).toEqual({ title: "テスト法案", description: "議案の詳細情報" });
  });

  it("AI自動生成版はタイトルと説明文にAI版であることを含める", () => {
    expect(
      buildBillOgText(
        { name: "テスト法案", article_kind: "ai_generated" },
        "要約"
      )
    ).toEqual({
      title: "【AI自動生成版】テスト法案｜みらい議会",
      description: "AIが作成した解説記事です（人のレビュー前）。要約",
    });
  });

  it("AI自動生成版で要約がなければ定型文だけにする", () => {
    expect(
      buildBillOgText({ name: "テスト法案", article_kind: "ai_generated" }, "")
    ).toEqual({
      title: "【AI自動生成版】テスト法案｜みらい議会",
      description: "AIが作成した解説記事です（人のレビュー前）。",
    });
  });
});
