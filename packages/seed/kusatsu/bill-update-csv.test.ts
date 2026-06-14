import { describe, expect, it } from "vitest";
import {
  parseBillUpdateCsv,
  serializeBillUpdateCsv,
  type BillUpdateRow,
} from "./bill-update-csv";

const row: BillUpdateRow = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "議第9号 テスト議案",
  status: "enacted",
  statusNote: "原案可決",
  submittedDate: "2026-02-26",
  publishStatus: "draft",
  isFeatured: false,
  slug: "r8-2-9",
  sourceUrl: "https://example.com/source.pdf",
  normalTitle: "テスト議案",
  normalSummary: "市民向けの概要です。",
  normalContent: "## 概要\n\n本文です。",
  hardTitle: "議第9号 テスト議案",
  hardSummary: "詳細な概要です。",
  hardContent: "## 詳細\n\n専門的な本文です。",
};

describe("bill update CSV", () => {
  it("複数行とカンマを含むデータを往復変換できる", () => {
    const csv = serializeBillUpdateCsv([
      { ...row, normalSummary: "概要, 補足" },
    ]);

    expect(parseBillUpdateCsv(csv)).toEqual([
      { ...row, normalSummary: "概要, 補足" },
    ]);
  });

  it("重複IDを拒否する", () => {
    const csv = serializeBillUpdateCsv([row, row]);

    expect(() => parseBillUpdateCsv(csv)).toThrow("id が重複しています");
  });

  it("不正な公開状態を拒否する", () => {
    const csv = serializeBillUpdateCsv([row]).replace(",draft,", ",invalid,");

    expect(() => parseBillUpdateCsv(csv)).toThrow(
      "publish_status の値が不正です"
    );
  });
});
