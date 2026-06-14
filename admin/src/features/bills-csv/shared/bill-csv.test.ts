import { describe, expect, it } from "vitest";
import { BILL_CSV_COLUMNS, parseBillCsv, serializeBillCsv } from "./bill-csv";

const header = BILL_CSV_COLUMNS.join(",");

describe("bill CSV", () => {
  it("IDが空欄の行を新規議案として読み込む", () => {
    const csv = `${header}
,議第1号,introduced,,2026-06-01,published,true,false,mayor,r8-6,gi-1,https://example.com,議第1号,概要,本文,,,
`;

    expect(parseBillCsv(csv)).toEqual([
      expect.objectContaining({
        id: null,
        name: "議第1号",
        originatingHouse: "HR",
        sessionSlug: "r8-6",
        hardTitle: "議第1号",
        hardSummary: "概要",
        hardContent: "本文",
      }),
    ]);
  });

  it("IDがある行を既存議案として読み込む", () => {
    const csv = `${header}
existing-id,議第2号,enacted,可決,2026-06-02,draft,false,true,member,r8-6,,,,議第2号,概要,本文,詳しい議第2号,詳しい概要,詳しい本文
`;

    expect(parseBillCsv(csv)[0]).toEqual(
      expect.objectContaining({
        id: "existing-id",
        status: "enacted",
        statusNote: "可決",
        originatingHouse: "HC",
      })
    );
  });

  it("不正な真偽値を拒否する", () => {
    const csv = `${header}
,議第3号,introduced,,2026-06-03,published,yes,false,mayor,r8-6,,,議第3号,,,,,
`;

    expect(() => parseBillCsv(csv)).toThrow(
      "2行目: is_featuredはtrueまたはfalseにしてください"
    );
  });

  it("Excel向けのBOM付きCSVを出力する", () => {
    expect(serializeBillCsv([])).toBe(`\uFEFF${header}\n\n`);
  });
});
