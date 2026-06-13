import { describe, expect, it } from "vitest";
import type { RawOpinionRow } from "../types";
import { buildPublicBillOpinions } from "./build-public-bill-opinions";

function row(overrides: Partial<RawOpinionRow> = {}): RawOpinionRow {
  return {
    id: `o-${Math.random()}`,
    interview_report_id: "r1",
    created_at: null,
    title: "t",
    content: "c",
    contextual_quote: "q",
    source_message_id: null,
    bill_sentiment: null,
    is_public_by_user: true,
    is_public_by_admin: true,
    moderation_status: "ok",
    role: "general_citizen",
    role_title: null,
    ...overrides,
  };
}

describe("buildPublicBillOpinions", () => {
  it("公開レポート（管理者公開×ユーザー公開）以外を除外する", () => {
    const opinions = buildPublicBillOpinions([
      row({ id: "ok" }),
      row({ id: "user-only", is_public_by_admin: false }),
      row({ id: "admin-only", is_public_by_user: false }),
    ]);
    expect(opinions.map((o) => o.id)).toEqual(["ok"]);
  });

  it("role→カテゴリ・bill_sentimentを正規化、report_publicに管理者公開を反映", () => {
    const opinions = buildPublicBillOpinions([
      row({
        role: "work_related",
        bill_sentiment: "期待",
      }),
    ]);
    expect(opinions[0].user_category).toBe("industry");
    expect(opinions[0].bill_sentiment).toBe("期待");
    expect(opinions[0].report_public).toBe(true);
  });
});
