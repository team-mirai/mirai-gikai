import { describe, expect, it } from "vitest";
import { toStanceColumns } from "./to-stance-columns";

describe("toStanceColumns", () => {
  it("publishAt を指定すると publish_at に変換する", () => {
    expect(
      toStanceColumns({
        type: "for",
        comment: "賛成の理由",
        publishAt: "2026-10-01T12:00:00+09:00",
      })
    ).toEqual({
      type: "for",
      comment: "賛成の理由",
      publish_at: "2026-10-01T12:00:00+09:00",
    });
  });

  it("publishAt が null なら publish_at を null（即時公開）にする", () => {
    expect(
      toStanceColumns({ type: "for", comment: "", publishAt: null })
    ).toEqual({ type: "for", comment: null, publish_at: null });
  });

  it("publishAt が未指定なら publish_at を含めず既存値を保持する", () => {
    const columns = toStanceColumns({ type: "against" });
    expect(columns).toEqual({ type: "against", comment: null });
    expect("publish_at" in columns).toBe(false);
  });
});

describe("toStanceColumns（新フォーマット）", () => {
  it("判断の理由・箇条書き・補足情報を整形してカラムに変換する", () => {
    expect(
      toStanceColumns({
        type: "for",
        reasonSummary: " 賛成します。 ",
        reasonPoints: ["必要性がある", "", " 条件付きで賛成 "],
        supplements: [
          { title: "今後の働きかけ", body: "- 報告を求めます" },
          { title: "", body: "" },
        ],
      })
    ).toEqual({
      type: "for",
      comment: null,
      reason_summary: "賛成します。",
      reason_points: ["必要性がある", "条件付きで賛成"],
      supplements: [{ title: "今後の働きかけ", body: "- 報告を求めます" }],
    });
  });

  it("判断の理由（一言）が空なら null にする", () => {
    expect(
      toStanceColumns({ type: "for", reasonSummary: "  " }).reason_summary
    ).toBeNull();
  });

  it("新フォーマットの項目が未指定なら各カラムを含めず既存値を保持する", () => {
    const columns = toStanceColumns({ type: "for", comment: "旧フォーマット" });
    expect("reason_summary" in columns).toBe(false);
    expect("reason_points" in columns).toBe(false);
    expect("supplements" in columns).toBe(false);
  });
});
