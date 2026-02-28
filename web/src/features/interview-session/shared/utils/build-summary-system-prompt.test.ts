import { describe, expect, it } from "vitest";
import type { BillWithContent } from "@/features/bills/shared/types";
import { buildSummarySystemPrompt } from "./build-summary-system-prompt";

const makeBill = (
  overrides: Partial<BillWithContent> = {}
): BillWithContent => ({
  id: "bill-1",
  name: "テスト法案",
  is_featured: false,
  originating_house: "HR",
  shugiin_url: null,
  diet_session_id: null,
  publish_status: "published",
  published_at: null,
  share_thumbnail_url: null,
  status: "introduced",
  status_note: null,
  status_order: 4,
  thumbnail_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  bill_content: {
    id: "bc-1",
    bill_id: "bill-1",
    title: "テスト法案タイトル",
    summary: "テスト法案の要約です",
    content: "テスト法案の内容",
    difficulty_level: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  tags: [],
  ...overrides,
});

describe("buildSummarySystemPrompt", () => {
  it("正常なbill情報・テーマ・メッセージでプロンプトに全情報が含まれる", () => {
    const result = buildSummarySystemPrompt({
      bill: makeBill(),
      interviewConfig: { themes: ["医療", "教育"] },
      messages: [
        { role: "assistant", content: "こんにちは" },
        { role: "user", content: "賛成です" },
      ],
    });

    expect(result).toContain("テスト法案");
    expect(result).toContain("テスト法案タイトル");
    expect(result).toContain("テスト法案の要約です");
    expect(result).toContain("- 医療");
    expect(result).toContain("- 教育");
    expect(result).toContain("assistant: こんにちは");
    expect(result).toContain("user: 賛成です");
  });

  it("bill=nullの場合のフォールバック（空文字）", () => {
    const result = buildSummarySystemPrompt({
      bill: null,
      interviewConfig: { themes: ["テーマ1"] },
      messages: [{ role: "user", content: "テスト" }],
    });

    expect(result).toContain("- 法案名: \n");
    expect(result).toContain("- 法案タイトル: \n");
    expect(result).toContain("- 法案要約: \n");
  });

  it("テーマ未設定の場合「（テーマ未設定）」が含まれる", () => {
    const result = buildSummarySystemPrompt({
      bill: makeBill(),
      interviewConfig: null,
      messages: [{ role: "user", content: "テスト" }],
    });

    expect(result).toContain("（テーマ未設定）");
  });

  it("テーマが複数ある場合、全テーマが「- テーマ名」形式で含まれる", () => {
    const result = buildSummarySystemPrompt({
      bill: makeBill(),
      interviewConfig: { themes: ["経済", "環境", "安全保障"] },
      messages: [],
    });

    expect(result).toContain("- 経済");
    expect(result).toContain("- 環境");
    expect(result).toContain("- 安全保障");
  });

  it("メッセージ空配列の場合エラーなく動く", () => {
    const result = buildSummarySystemPrompt({
      bill: makeBill(),
      interviewConfig: { themes: ["テーマ1"] },
      messages: [],
    });

    expect(result).toContain("## 会話履歴\n\n");
  });

  it("会話履歴が 'role: content' フォーマットで含まれる", () => {
    const result = buildSummarySystemPrompt({
      bill: makeBill(),
      interviewConfig: { themes: [] },
      messages: [
        { role: "assistant", content: "質問1" },
        { role: "user", content: "回答1" },
        { role: "assistant", content: "質問2" },
        { role: "user", content: "回答2" },
      ],
    });

    expect(result).toContain(
      "assistant: 質問1\nuser: 回答1\nassistant: 質問2\nuser: 回答2"
    );
  });
});
