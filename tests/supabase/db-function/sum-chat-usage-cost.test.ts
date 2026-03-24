import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  type TestUser,
} from "../utils";

describe("sum_chat_usage_cost", () => {
  let testUser: TestUser;

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await adminClient
      .from("chat_usage_events")
      .delete()
      .eq("user_id", testUser.id);
    await cleanupTestUser(testUser.id);
  });

  it("指定期間のcost_usdの合計を返す", async () => {
    await adminClient.from("chat_usage_events").insert([
      {
        user_id: testUser.id,
        model: "gpt-4o",
        cost_usd: 0.01,
        occurred_at: "2025-06-15T10:00:00Z",
      },
      {
        user_id: testUser.id,
        model: "gpt-4o",
        cost_usd: 0.02,
        occurred_at: "2025-06-15T11:00:00Z",
      },
      {
        user_id: testUser.id,
        model: "gpt-4o",
        cost_usd: 0.05,
        occurred_at: "2025-06-16T10:00:00Z",
      },
    ]);

    const { data, error } = await adminClient.rpc("sum_chat_usage_cost", {
      from_iso: "2025-06-15T00:00:00Z",
      to_iso: "2025-06-16T00:00:00Z",
    });

    expect(error).toBeNull();
    expect(Number(data)).toBeCloseTo(0.03, 6);
  });

  it("該当データがない場合は0を返す", async () => {
    const { data, error } = await adminClient.rpc("sum_chat_usage_cost", {
      from_iso: "2099-01-01T00:00:00Z",
      to_iso: "2099-01-02T00:00:00Z",
    });

    expect(error).toBeNull();
    expect(Number(data)).toBe(0);
  });
});
