import { describe, expect, it } from "vitest";
import type { BillUpdateRow } from "./bill-update-csv";
import {
  applyR8FebOfficialData,
  R8_FEB_BILLS,
} from "./r8-feb-bill-data";

const row: BillUpdateRow = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "議第14号　草津市手数料条例の一部を改正する条例案",
  status: "introduced",
  statusNote: null,
  submittedDate: "2026-02-26",
  publishStatus: "draft",
  isFeatured: false,
  slug: null,
  sourceUrl: null,
  normalTitle: "仮タイトル",
  normalSummary: "仮概要",
  normalContent: "仮本文",
  hardTitle: "仮タイトル",
  hardSummary: "仮概要",
  hardContent: "仮本文",
};

describe("令和8年2月定例会の公式データ", () => {
  it("議第2号から23号まで重複なく定義されている", () => {
    expect(R8_FEB_BILLS.map((bill) => bill.number)).toEqual(
      Array.from({ length: 22 }, (_, index) => index + 2)
    );
  });

  it("既存行を可決済みの公開データへ変換する", () => {
    const updated = applyR8FebOfficialData(row);

    expect(updated.status).toBe("enacted");
    expect(updated.statusNote).toBe("原案可決（2026年3月26日）");
    expect(updated.isFeatured).toBe(true);
    expect(updated.slug).toBe("r8-2-gidai-14");
    expect(updated.normalContent).toContain("産後ケア");
    expect(updated.normalContent).toContain("草津市公式資料");
  });
});
