import { describe, expect, it } from "vitest";
import type { BillMilestoneSource } from "../types";
import {
  buildBillMilestoneFact,
  latestTimestamp,
} from "./build-bill-milestone-fact";

const now = new Date("2026-11-10T12:00:00+09:00");
const webUrl = "https://example.com";

const baseSource: BillMilestoneSource = {
  id: "bill-1",
  name: "核融合発電の推進に関する法律案",
  slug: "222-kaku-21",
  originating_house: "HR",
  status: "in_receiving_house",
  publish_status: "published",
  article_kind: "standard",
  first_published_at: "2026-11-10T01:00:00+00:00",
  bill_contents: [
    { difficulty_level: "hard", title: "難しい版のタイトル" },
    { difficulty_level: "normal", title: "やさしい版のタイトル" },
  ],
  mirai_stances: null,
  interview_configs: [],
  status_changes: [],
};

describe("latestTimestamp", () => {
  it("null を無視して新しい方を返す", () => {
    expect(
      latestTimestamp(
        "2026-11-10T01:00:00+00:00",
        null,
        "2026-11-10T11:00:00+09:00"
      )
    ).toBe("2026-11-10T11:00:00+09:00");
  });

  it("すべて null なら null", () => {
    expect(latestTimestamp(null, null)).toBeNull();
  });
});

describe("buildBillMilestoneFact", () => {
  it("法案の基本情報と URL を返す", () => {
    const fact = buildBillMilestoneFact(baseSource, { now, webUrl });
    expect(fact).toMatchObject({
      billId: "bill-1",
      name: "核融合発電の推進に関する法律案",
      slug: "222-kaku-21",
      easyTitle: "やさしい版のタイトル",
      originatingHouse: "HR",
      status: "in_receiving_house",
      publishStatus: "published",
      articleKind: "standard",
      firstPublishedAt: "2026-11-10T01:00:00+00:00",
      urls: {
        bill: "https://example.com/bills/bill-1",
        interview: "https://example.com/bills/bill-1/interview",
      },
    });
  });

  it("やさしい版の記事が無ければ easyTitle は null", () => {
    const fact = buildBillMilestoneFact(
      { ...baseSource, bill_contents: [] },
      { now, webUrl }
    );
    expect(fact.easyTitle).toBeNull();
  });

  it("審議状況の変化を古い順に並べる", () => {
    const fact = buildBillMilestoneFact(
      {
        ...baseSource,
        status_changes: [
          {
            from_status: "in_originating_house",
            to_status: "in_receiving_house",
            changed_at: "2026-11-10T02:00:00+00:00",
          },
          {
            from_status: "introduced",
            to_status: "in_originating_house",
            changed_at: "2026-11-10T01:00:00+00:00",
          },
        ],
      },
      { now, webUrl }
    );
    expect(fact.statusChanges).toEqual([
      {
        from: "introduced",
        to: "in_originating_house",
        changedAt: "2026-11-10T01:00:00+00:00",
      },
      {
        from: "in_originating_house",
        to: "in_receiving_house",
        changedAt: "2026-11-10T02:00:00+00:00",
      },
    ]);
  });

  describe("stance", () => {
    it("賛否が無ければ null", () => {
      expect(
        buildBillMilestoneFact(baseSource, { now, webUrl }).stance
      ).toBeNull();
    });

    it("予約公開の時刻が来ていなければ isPublished は false で、publishedAt は予約公開日時", () => {
      const fact = buildBillMilestoneFact(
        {
          ...baseSource,
          mirai_stances: {
            type: "for",
            is_published: true,
            published_at: "2026-11-10T01:00:00+00:00",
            publish_at: "2026-11-11T09:00:00+09:00",
          },
        },
        { now, webUrl }
      );
      expect(fact.stance).toEqual({
        type: "for",
        isPublished: false,
        publishedAt: "2026-11-11T09:00:00+09:00",
      });
    });

    it("即時公開なら publishedAt は公開した日時", () => {
      const fact = buildBillMilestoneFact(
        {
          ...baseSource,
          mirai_stances: {
            type: "against",
            is_published: true,
            published_at: "2026-11-10T01:00:00+00:00",
            publish_at: null,
          },
        },
        { now, webUrl }
      );
      expect(fact.stance).toEqual({
        type: "against",
        isPublished: true,
        publishedAt: "2026-11-10T01:00:00+00:00",
      });
    });
  });

  describe("interview", () => {
    it("削除されていない公開中の設定があれば、その公開日時を返す", () => {
      const fact = buildBillMilestoneFact(
        {
          ...baseSource,
          interview_configs: [
            {
              status: "public",
              published_at: "2026-11-09T00:00:00+00:00",
              deleted_at: "2026-11-09T12:00:00+00:00",
            },
            { status: "closed", published_at: null, deleted_at: null },
            {
              status: "public",
              published_at: "2026-11-10T00:00:00+00:00",
              deleted_at: null,
            },
          ],
        },
        { now, webUrl }
      );
      expect(fact.interview).toEqual({
        isPublic: true,
        publishedAt: "2026-11-10T00:00:00+00:00",
      });
    });

    it("公開中の設定が無ければ isPublic は false で publishedAt は null", () => {
      const fact = buildBillMilestoneFact(
        {
          ...baseSource,
          interview_configs: [
            { status: "closed", published_at: null, deleted_at: null },
          ],
        },
        { now, webUrl }
      );
      expect(fact.interview).toEqual({ isPublic: false, publishedAt: null });
    });
  });
});
