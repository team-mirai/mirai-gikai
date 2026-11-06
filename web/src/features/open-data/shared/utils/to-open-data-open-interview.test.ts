import { describe, expect, it } from "vitest";
import {
  type OpenDataOpenInterviewRow,
  toOpenDataOpenInterviewItem,
} from "./to-open-data-open-interview";

const baseRow: OpenDataOpenInterviewRow = {
  estimated_duration: 15,
  created_at: "2026-10-01T00:00:00+00:00",
  bills: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "テスト法案",
    thumbnail_url: "https://example.com/thumb.png",
    bill_contents: [{ title: "わかりやすいタイトル", summary: "概要" }],
  },
};

describe("toOpenDataOpenInterviewItem", () => {
  it("インタビュー設定行をAPIレスポンス形式に変換する", () => {
    expect(
      toOpenDataOpenInterviewItem(baseRow, "https://gikai.example.com")
    ).toEqual({
      billId: "123e4567-e89b-12d3-a456-426614174000",
      billName: "テスト法案",
      title: "わかりやすいタイトル",
      summary: "概要",
      thumbnailUrl: "https://example.com/thumb.png",
      estimatedDurationMinutes: 15,
      interviewUrl:
        "https://gikai.example.com/bills/123e4567-e89b-12d3-a456-426614174000/interview",
      createdAt: "2026-10-01T00:00:00+00:00",
    });
  });

  it("webUrl の末尾スラッシュの有無に関わらず同じURLを組み立てる", () => {
    expect(
      toOpenDataOpenInterviewItem(baseRow, "https://gikai.example.com/")
        .interviewUrl
    ).toBe(
      "https://gikai.example.com/bills/123e4567-e89b-12d3-a456-426614174000/interview"
    );
  });

  it("コンテンツ・サムネイル・目安時間が無い場合は空文字・null にする", () => {
    const item = toOpenDataOpenInterviewItem(
      {
        ...baseRow,
        estimated_duration: null,
        bills: { ...baseRow.bills, thumbnail_url: null, bill_contents: [] },
      },
      "https://gikai.example.com"
    );

    expect(item.title).toBe("");
    expect(item.summary).toBe("");
    expect(item.thumbnailUrl).toBeNull();
    expect(item.estimatedDurationMinutes).toBeNull();
  });
});
