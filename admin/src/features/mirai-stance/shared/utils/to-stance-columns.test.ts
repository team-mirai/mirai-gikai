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
