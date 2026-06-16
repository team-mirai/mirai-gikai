import { describe, expect, it } from "vitest";
import type { RawRespondentRow } from "../types";
import { buildPublicBillRespondents } from "./build-public-bill-respondents";

function row(overrides: Partial<RawRespondentRow> = {}): RawRespondentRow {
  return {
    id: "r1",
    role: "general_citizen",
    role_title: null,
    stance: null,
    summary: "要約",
    created_at: null,
    ...overrides,
  };
}

describe("buildPublicBillRespondents", () => {
  it("role を §9 の4区分にマップする", () => {
    const result = buildPublicBillRespondents([
      row({ id: "a", role: "daily_life_affected" }),
      row({ id: "b", role: "work_related" }),
      row({ id: "c", role: "subject_expert" }),
      row({ id: "d", role: "general_citizen" }),
      row({ id: "e", role: null }),
    ]);
    expect(result.map((r) => r.user_category)).toEqual([
      "affected",
      "industry",
      "expert",
      "citizen",
      "citizen",
    ]);
  });

  it("stance を 期待/懸念 に正規化し、それ以外は null", () => {
    const result = buildPublicBillRespondents([
      row({ id: "for", stance: "for" }),
      row({ id: "against", stance: "against" }),
      row({ id: "neutral", stance: "neutral" }),
      row({ id: "null", stance: null }),
    ]);
    expect(result.map((r) => r.bill_sentiment)).toEqual([
      "期待",
      "懸念",
      null,
      null,
    ]);
  });

  it("summary・role_title・created_at をそのまま引き継ぐ", () => {
    const [r] = buildPublicBillRespondents([
      row({
        role_title: "育休経験者",
        summary: "本文",
        created_at: "2026-06-09",
      }),
    ]);
    expect(r.role_title).toBe("育休経験者");
    expect(r.summary).toBe("本文");
    expect(r.created_at).toBe("2026-06-09");
  });
});
