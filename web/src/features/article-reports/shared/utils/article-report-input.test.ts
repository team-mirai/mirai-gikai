import { describe, expect, it } from "vitest";
import {
  hasArticleReportBody,
  parseArticleReportInput,
} from "./article-report-input";

const validInput = {
  billId: "bda02b2e-2e40-4905-93ed-af8d67bafd45",
  difficultyLevel: "normal",
  category: "factual_error",
  body: "施行日が違います",
};

describe("parseArticleReportInput", () => {
  it("有効な入力を受け付ける", () => {
    const result = parseArticleReportInput(validInput);
    expect(result).toEqual({ ok: true, data: validInput });
  });

  it("種類は省略できる", () => {
    const { category: _, ...withoutCategory } = validInput;
    const result = parseArticleReportInput(withoutCategory);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBeUndefined();
    }
  });

  it("本文の前後の空白を取り除く", () => {
    const result = parseArticleReportInput({
      ...validInput,
      body: "  施行日が違います\n",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.body).toBe("施行日が違います");
    }
  });

  it("空白だけの本文はエラー", () => {
    const result = parseArticleReportInput({ ...validInput, body: "   " });
    expect(result).toEqual({ ok: false, error: "内容を入力してください" });
  });

  it("1000文字ちょうどは受け付ける", () => {
    const result = parseArticleReportInput({
      ...validInput,
      body: "あ".repeat(1000),
    });
    expect(result.ok).toBe(true);
  });

  it("1000文字を超える本文はエラー", () => {
    const result = parseArticleReportInput({
      ...validInput,
      body: "あ".repeat(1001),
    });
    expect(result).toEqual({
      ok: false,
      error: "内容は1000文字以内で入力してください",
    });
  });

  it("前後の空白を除いて1000文字なら受け付ける", () => {
    const result = parseArticleReportInput({
      ...validInput,
      body: ` ${"あ".repeat(1000)} `,
    });
    expect(result.ok).toBe(true);
  });

  it("未知の種類はエラー", () => {
    const result = parseArticleReportInput({
      ...validInput,
      category: "spam",
    });
    expect(result.ok).toBe(false);
  });

  it("未知の難易度はエラー", () => {
    const result = parseArticleReportInput({
      ...validInput,
      difficultyLevel: "easy",
    });
    expect(result.ok).toBe(false);
  });

  it("UUIDでない議案IDはエラー", () => {
    const result = parseArticleReportInput({
      ...validInput,
      billId: "not-a-uuid",
    });
    expect(result.ok).toBe(false);
  });
});

describe("hasArticleReportBody", () => {
  it("空白以外の文字があれば true", () => {
    expect(hasArticleReportBody(" a ")).toBe(true);
  });

  it("空文字や空白だけなら false", () => {
    expect(hasArticleReportBody("")).toBe(false);
    expect(hasArticleReportBody(" \n\t")).toBe(false);
  });
});
