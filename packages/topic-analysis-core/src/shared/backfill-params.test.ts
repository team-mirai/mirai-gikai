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

  it("登録済みモデルIDを受け付ける", () => {
    const result = resolveBackfillParams({ model: "anthropic/claude-sonnet-4.6" });
    expect(result).toEqual({
      ok: true,
      params: {
        billId: undefined,
        scope: "pending",
        model: "anthropic/claude-sonnet-4.6",
      },
    });
  });

  it("未知のモデルIDはエラー", () => {
    const result = resolveBackfillParams({ model: "openai/gpt-3.5-turbo" });
    expect(result.ok).toBe(false);
  });

  it("空文字・空白の model は未指定として扱う", () => {
    const result = resolveBackfillParams({ model: "  " });
    expect(result).toEqual({
      ok: true,
      params: { billId: undefined, scope: "pending", model: undefined },
    });
  });

  it("非文字列の model は throw せず検証エラーになる", () => {
    const result = resolveBackfillParams({ model: 123 });
    expect(result.ok).toBe(false);
  });

  it("非文字列の billId は throw せず検証エラーになる", () => {
    const result = resolveBackfillParams({ billId: { id: 1 } });
    expect(result.ok).toBe(false);
  });
});
