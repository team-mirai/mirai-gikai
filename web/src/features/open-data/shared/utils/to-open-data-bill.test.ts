import { describe, expect, it } from "vitest";
import {
  type OpenDataBillRow,
  toOpenDataBillDetail,
  toOpenDataBillItem,
  toOpenDataMiraiStance,
} from "./to-open-data-bill";

const now = new Date("2026-10-01T12:00:00+09:00");

const baseRow: OpenDataBillRow = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "テスト法案",
  status: "in_originating_house",
  status_note: null,
  originating_house: "HR",
  submitted_date: "2026-01-10",
  published_at: "2026-01-15T00:00:00+00:00",
  created_at: "2026-01-01T00:00:00+00:00",
  bill_contents: [{ title: "わかりやすいタイトル", summary: "概要" }],
  mirai_stances: {
    type: "conditional_for",
    comment: "条件付きで賛成",
    publish_at: null,
  },
  bills_tags: [{ tags: { id: "tag-1", label: "経済" } }],
};

describe("toOpenDataBillItem", () => {
  it("議案行をAPIレスポンス形式に変換する", () => {
    expect(toOpenDataBillItem(baseRow, now)).toEqual({
      billId: "123e4567-e89b-12d3-a456-426614174000",
      name: "テスト法案",
      title: "わかりやすいタイトル",
      summary: "概要",
      status: "in_originating_house",
      statusLabel: "衆議院審議中",
      statusNote: null,
      originatingHouse: "HR",
      originatingHouseLabel: "衆議院",
      submittedDate: "2026-01-10",
      publishedAt: "2026-01-15T00:00:00+00:00",
      tags: [{ id: "tag-1", label: "経済" }],
      miraiStance: {
        type: "conditional_for",
        label: "条件付き賛成",
        comment: "条件付きで賛成",
      },
      createdAt: "2026-01-01T00:00:00+00:00",
    });
  });

  it("賛否・タグがない場合は null / 空配列を返す", () => {
    const item = toOpenDataBillItem(
      {
        ...baseRow,
        mirai_stances: null,
        bills_tags: [],
      },
      now
    );
    expect(item.miraiStance).toBeNull();
    expect(item.tags).toEqual([]);
  });

  it("タグの参照が欠けている場合は除外する", () => {
    const item = toOpenDataBillItem(
      {
        ...baseRow,
        bills_tags: [{ tags: null }, { tags: { id: "tag-2", label: "環境" } }],
      },
      now
    );
    expect(item.tags).toEqual([{ id: "tag-2", label: "環境" }]);
  });
});

describe("toOpenDataBillDetail", () => {
  it("一覧項目に本文（content）を加えて返す", () => {
    const detail = toOpenDataBillDetail(
      {
        ...baseRow,
        bill_contents: [
          { title: "タイトル", summary: "概要", content: "# 本文" },
        ],
      },
      now
    );
    expect(detail.title).toBe("タイトル");
    expect(detail.content).toBe("# 本文");
  });
});

describe("toOpenDataMiraiStance", () => {
  it("賛否種別に日本語ラベルを付与する", () => {
    expect(
      toOpenDataMiraiStance(
        { type: "for", comment: null, publish_at: null },
        now
      )
    ).toEqual({
      type: "for",
      label: "賛成",
      comment: null,
    });
  });

  it("null の場合は null を返す", () => {
    expect(toOpenDataMiraiStance(null, now)).toBeNull();
  });

  it("公開日時を過ぎた賛否は返す", () => {
    const stance = toOpenDataMiraiStance(
      {
        type: "against",
        comment: "反対の理由",
        publish_at: "2026-10-01T11:00:00+09:00",
      },
      now
    );
    expect(stance?.comment).toBe("反対の理由");
  });

  it("公開日時前の賛否は null を返す", () => {
    expect(
      toOpenDataMiraiStance(
        {
          type: "against",
          comment: "反対の理由",
          publish_at: "2026-10-01T13:00:00+09:00",
        },
        now
      )
    ).toBeNull();
  });
});
