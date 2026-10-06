import { describe, expect, it } from "vitest";
import type { BillWithContent, MiraiStance } from "../types";
import { hideUnpublishedStance } from "./hide-unpublished-stance";

function makeStance(publishAt: string | null): MiraiStance {
  return {
    id: "stance-1",
    bill_id: "bill-1",
    type: "for",
    comment: "賛成の理由",
    reason_summary: null,
    reason_points: [],
    supplements: [],
    publish_at: publishAt,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function makeBill(stance?: MiraiStance): BillWithContent {
  return {
    id: "bill-1",
    name: "テスト法案",
    tags: [],
    mirai_stance: stance,
  } as unknown as BillWithContent;
}

describe("hideUnpublishedStance", () => {
  const now = new Date("2026-10-01T12:00:00+09:00");

  it("公開日時未設定の賛否はそのまま返す", () => {
    const bill = makeBill(makeStance(null));
    expect(hideUnpublishedStance(bill, now)).toBe(bill);
  });

  it("公開日時を過ぎた賛否はそのまま返す", () => {
    const bill = makeBill(makeStance("2026-10-01T11:00:00+09:00"));
    expect(hideUnpublishedStance(bill, now).mirai_stance?.comment).toBe(
      "賛成の理由"
    );
  });

  it("公開日時前の賛否は賛否・コメントごと取り除く", () => {
    const bill = makeBill(makeStance("2026-10-01T13:00:00+09:00"));
    const result = hideUnpublishedStance(bill, now);
    expect(result.mirai_stance).toBeUndefined();
    expect(result.name).toBe("テスト法案");
  });

  it("賛否がない議案はそのまま返す", () => {
    const bill = makeBill();
    expect(hideUnpublishedStance(bill, now)).toBe(bill);
  });
});
