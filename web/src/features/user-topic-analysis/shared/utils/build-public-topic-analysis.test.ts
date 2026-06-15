import { describe, expect, it } from "vitest";
import type { RawOpinionRow, RawTopicRow } from "../types";
import {
  buildPublicTopicAnalysis,
  mapRoleToCategory,
} from "./build-public-topic-analysis";

const meta = {
  bill_id: "bill-1",
  version: 3,
  generated_at: "2026-06-09T00:00:00.000Z",
};

/** デフォルト「表示可能」な意見行を作る。 */
function op(overrides: Partial<RawOpinionRow> = {}): RawOpinionRow {
  return {
    id: "o1",
    interview_report_id: "r1",
    created_at: "2026-06-09T00:00:00.000Z",
    title: "t",
    content: "c",
    contextual_quote: "q",
    source_message_id: null,
    bill_sentiment: null,
    richness: null,
    is_public_by_user: true,
    is_public_by_admin: true,
    moderation_status: "ok",
    role: "general_citizen",
    role_title: null,
    ...overrides,
  };
}

function topic(id: string, opinions: RawOpinionRow[]): RawTopicRow {
  return { id, title: `title-${id}`, description: `desc-${id}`, opinions };
}

describe("mapRoleToCategory", () => {
  it("role を4区分にマップする", () => {
    expect(mapRoleToCategory("daily_life_affected")).toBe("affected");
    expect(mapRoleToCategory("work_related")).toBe("industry");
    expect(mapRoleToCategory("subject_expert")).toBe("expert");
    expect(mapRoleToCategory("general_citizen")).toBe("citizen");
  });
  it("null・未知の値は一般市民に倒す", () => {
    expect(mapRoleToCategory(null)).toBe("citizen");
    expect(mapRoleToCategory("unknown")).toBe("citizen");
  });
});

describe("buildPublicTopicAnalysis（§8 表示時フィルタ）", () => {
  it("管理者非公開・ユーザー非公開・モデレーションNG/警告の意見を除外する", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [
        op({ id: "ok" }),
        op({ id: "admin-private", is_public_by_admin: false }),
        op({ id: "private", is_public_by_user: false }),
        op({ id: "ng", moderation_status: "ng" }),
        op({ id: "warning", moderation_status: "warning" }),
        op({ id: "null-mod", moderation_status: null }),
      ]),
    ]);
    expect(result.topics).toHaveLength(1);
    const ids = result.topics[0].opinions.map((o) => o.id);
    expect(ids).toEqual(["ok"]);
    expect(result.topics[0].opinion_count).toBe(1);
    expect(result.total_opinions).toBe(1);
  });

  it("フィルタ後に0件のトピックはカードを作らない", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [op({ id: "a" })]),
      topic("t1", [op({ id: "b", is_public_by_user: false })]),
    ]);
    expect(result.topics.map((t) => t.id)).toEqual(["t0"]);
  });

  it("属性内訳をフィルタ後集合から再計算する", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [
        op({ id: "a", role: "daily_life_affected" }),
        op({ id: "b", role: "work_related" }),
        op({ id: "c", role: "subject_expert" }),
        op({ id: "d", role: "general_citizen" }),
        op({ id: "e", role: null }),
        // 除外される（カウントに含めない）
        op({ id: "x", role: "subject_expert", is_public_by_user: false }),
      ]),
    ]);
    const t = result.topics[0];
    expect(t.affected_count).toBe(1);
    expect(t.industry_count).toBe(1);
    expect(t.expert_count).toBe(1); // x は除外
    expect(t.citizen_count).toBe(2); // general_citizen + null
    expect(t.opinion_count).toBe(5);
  });

  it("期待/懸念を集計し、それ以外/nullは数えない", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [
        op({ id: "a", bill_sentiment: "期待" }),
        op({ id: "b", bill_sentiment: "期待" }),
        op({ id: "c", bill_sentiment: "懸念" }),
        op({ id: "d", bill_sentiment: null }),
        op({ id: "e", bill_sentiment: "その他" }),
      ]),
    ]);
    expect(result.topics[0].sentiment).toEqual({ 期待: 2, 懸念: 1 });
    // 不正な bill_sentiment は意見カード上 null に正規化
    const e = result.topics[0].opinions.find((o) => o.id === "e");
    expect(e?.bill_sentiment).toBeNull();
  });

  it("question_snippet は 4a では null 固定", () => {
    const result = buildPublicTopicAnalysis(meta, [topic("t0", [op()])]);
    expect(result.topics[0].opinions[0].question_snippet).toBeNull();
  });

  it("role_title を意見カードに引き継ぐ（引用の属性表示用）", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [op({ id: "a", role_title: "育休経験者" })]),
    ]);
    expect(result.topics[0].opinions[0].role_title).toBe("育休経験者");
  });

  it("表示される意見は必ず管理者公開済み（report_public=true）", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [
        op({ id: "a", is_public_by_admin: true }),
        // 管理者非公開はそもそも表示対象から除外される
        op({ id: "b", is_public_by_admin: false }),
      ]),
    ]);
    const ids = result.topics[0].opinions.map((o) => o.id);
    expect(ids).toEqual(["a"]);
    expect(result.topics[0].opinions.every((o) => o.report_public)).toBe(true);
  });

  it("全トピックが空なら topics 空・total 0、meta は保持", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [op({ is_public_by_user: false })]),
    ]);
    expect(result.topics).toEqual([]);
    expect(result.total_opinions).toBe(0);
    expect(result.version).toBe(3);
    expect(result.bill_id).toBe("bill-1");
    expect(result.generated_at).toBe("2026-06-09T00:00:00.000Z");
  });

  it("意見を richness 降順で並べ、null は最後尾にする", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [
        op({ id: "low", richness: 10 }),
        op({ id: "none", richness: null }),
        op({ id: "high", richness: 90 }),
        op({ id: "mid", richness: 50 }),
      ]),
    ]);
    expect(result.topics[0].opinions.map((o) => o.id)).toEqual([
      "high",
      "mid",
      "low",
      "none",
    ]);
  });

  it("richness 同点は元順序を保つ（安定ソート）", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [
        op({ id: "a", richness: 50 }),
        op({ id: "b", richness: 50 }),
        op({ id: "c", richness: 50 }),
      ]),
    ]);
    expect(result.topics[0].opinions.map((o) => o.id)).toEqual(["a", "b", "c"]);
  });

  it("richness を PublicOpinion に引き継ぐ", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [op({ id: "a", richness: 77 })]),
    ]);
    expect(result.topics[0].opinions[0].richness).toBe(77);
  });

  it("集計（件数・内訳・sentiment）は richness ソートの影響を受けない", () => {
    const result = buildPublicTopicAnalysis(meta, [
      topic("t0", [
        op({
          id: "a",
          role: "subject_expert",
          bill_sentiment: "期待",
          richness: 10,
        }),
        op({
          id: "b",
          role: "subject_expert",
          bill_sentiment: "懸念",
          richness: 90,
        }),
      ]),
    ]);
    const t = result.topics[0];
    expect(t.opinion_count).toBe(2);
    expect(t.expert_count).toBe(2);
    expect(t.sentiment).toEqual({ 期待: 1, 懸念: 1 });
  });
});
