import { describe, expect, it } from "vitest";
import { resolveBackfillParams } from "./backfill-params";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("resolveBackfillParams", () => {
  it("デフォルトは scope=pending・billId なし", () => {
    expect(resolveBackfillParams({})).toEqual({
      ok: true,
      params: { billId: undefined, scope: "pending" },
    });
  });

  it("billId 指定の pending を受け付ける", () => {
    expect(resolveBackfillParams({ billId: UUID })).toEqual({
      ok: true,
      params: { billId: UUID, scope: "pending" },
    });
  });

  it("scope=all は billId があれば受け付ける", () => {
    expect(resolveBackfillParams({ billId: UUID, scope: "all" })).toEqual({
      ok: true,
      params: { billId: UUID, scope: "all" },
    });
  });

  it("scope=all で billId が無ければエラー（全議案×全部は不可）", () => {
    const result = resolveBackfillParams({ scope: "all" });
    expect(result.ok).toBe(false);
  });

  it("未知の scope 文字列は pending に丸める", () => {
    expect(resolveBackfillParams({ scope: "everything" })).toEqual({
      ok: true,
      params: { billId: undefined, scope: "pending" },
    });
  });

  it("UUID 形式でない billId はエラー", () => {
    const result = resolveBackfillParams({ billId: "not-a-uuid" });
    expect(result.ok).toBe(false);
  });

  it("空文字・空白の billId は未指定として扱う", () => {
    expect(resolveBackfillParams({ billId: "   " })).toEqual({
      ok: true,
      params: { billId: undefined, scope: "pending" },
    });
  });
});
