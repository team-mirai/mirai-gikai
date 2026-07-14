import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestUser,
  createTestUser,
  type TestUser,
} from "../utils";

// 既存データと干渉しないよう、未来の期間にテストデータを置き
// from/to で必ず絞り込んで検証する
// （tests/mcp/chat-usage-tools.test.ts とも干渉しないよう年をずらしている）
const WINDOW_FROM = "2033-01-01T00:00:00.000Z";
const WINDOW_TO = "2033-01-02T00:00:00.000Z";
const iso = (offsetSec: number) =>
  new Date(new Date(WINDOW_FROM).getTime() + offsetSec * 1000).toISOString();

async function insertUsageEvent(params: {
  userId: string;
  promptName: string | null;
  occurredAt: string;
  sessionId?: string;
  billId?: string;
  totalTokens?: number;
  costUsd?: number;
}): Promise<void> {
  const { error } = await adminClient.from("chat_usage_events").insert({
    user_id: params.userId,
    session_id: params.sessionId ?? null,
    prompt_name: params.promptName,
    model: "test-model",
    total_tokens: params.totalTokens ?? 100,
    cost_usd: params.costUsd ?? 0.01,
    occurred_at: params.occurredAt,
    metadata: params.billId ? { billId: params.billId } : null,
  });
  if (error) throw new Error(`chat_usage_events 作成失敗: ${error.message}`);
}

describe("get_chat_usage_metrics() 関数", () => {
  let user1: TestUser;
  let user2: TestUser;
  beforeEach(async () => {
    user1 = await createTestUser();
    user2 = await createTestUser();
  });

  afterEach(async () => {
    await adminClient
      .from("chat_usage_events")
      .delete()
      .in("user_id", [user1.id, user2.id]);
    await cleanupTestUser(user1.id);
    await cleanupTestUser(user2.id);
  });

  it("prompt_nameごとに件数・ユニークユーザー・トークン・コストを集計する", async () => {
    // test-chat-a: user1が2回（同一セッション）、user2が1回
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-chat-a",
      occurredAt: iso(0),
      sessionId: "session-1",
      totalTokens: 100,
      costUsd: 0.01,
    });
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-chat-a",
      occurredAt: iso(10),
      sessionId: "session-1",
      totalTokens: 200,
      costUsd: 0.02,
    });
    await insertUsageEvent({
      userId: user2.id,
      promptName: "test-chat-a",
      occurredAt: iso(20),
      sessionId: "session-2",
      totalTokens: 300,
      costUsd: 0.03,
    });
    // test-chat-b: user1が1回
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-chat-b",
      occurredAt: iso(30),
      totalTokens: 50,
      costUsd: 0.005,
    });

    const { data, error } = await adminClient.rpc("get_chat_usage_metrics", {
      p_from: WINDOW_FROM,
      p_to: WINDOW_TO,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    // event_count 降順
    expect(data?.[0]).toMatchObject({
      prompt_name: "test-chat-a",
      event_count: 3,
      unique_user_count: 2,
      unique_session_count: 2,
      total_tokens: 600,
    });
    expect(Number(data?.[0].total_cost_usd)).toBeCloseTo(0.06, 6);
    expect(data?.[1]).toMatchObject({
      prompt_name: "test-chat-b",
      event_count: 1,
      unique_user_count: 1,
      unique_session_count: 0,
      total_tokens: 50,
    });
  });

  it("期間フィルタが機能する（from以上・to未満）", async () => {
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-chat-range",
      occurredAt: iso(0),
    });
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-chat-range",
      occurredAt: iso(3600),
    });

    // 前半のみを対象にする
    const { data, error } = await adminClient.rpc("get_chat_usage_metrics", {
      p_from: WINDOW_FROM,
      p_to: iso(1800),
    });

    expect(error).toBeNull();
    const row = data?.find((r) => r.prompt_name === "test-chat-range");
    expect(row?.event_count).toBe(1);
  });

  it("billIdフィルタは metadata.billId が一致するイベントのみ返す", async () => {
    const billId = crypto.randomUUID();
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-bill-chat",
      occurredAt: iso(0),
      billId,
    });
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-bill-chat",
      occurredAt: iso(10),
      billId: crypto.randomUUID(), // 別議案
    });
    await insertUsageEvent({
      userId: user1.id,
      promptName: "test-no-bill",
      occurredAt: iso(20), // metadataなし
    });

    const { data, error } = await adminClient.rpc("get_chat_usage_metrics", {
      p_from: WINDOW_FROM,
      p_to: WINDOW_TO,
      p_bill_id: billId,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({
      prompt_name: "test-bill-chat",
      event_count: 1,
    });
  });

  it("prompt_nameがNULLのイベントは (unknown) に集計する", async () => {
    await insertUsageEvent({
      userId: user1.id,
      promptName: null,
      occurredAt: iso(0),
    });

    const { data, error } = await adminClient.rpc("get_chat_usage_metrics", {
      p_from: WINDOW_FROM,
      p_to: WINDOW_TO,
    });

    expect(error).toBeNull();
    expect(data?.[0]).toMatchObject({
      prompt_name: "(unknown)",
      event_count: 1,
    });
  });

  it("該当イベントがない場合は空配列を返す", async () => {
    const { data, error } = await adminClient.rpc("get_chat_usage_metrics", {
      p_from: "2032-01-01T00:00:00.000Z",
      p_to: "2032-01-02T00:00:00.000Z",
    });

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
