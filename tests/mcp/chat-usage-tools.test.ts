import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerChatUsageTools } from "../../admin/src/features/mcp/server/tools/register-chat-usage-tools";
import type { Database } from "../../packages/supabase/types/supabase.types";
import {
  adminClient,
  cleanupTestUser,
  createTestUser,
  type TestUser,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

// 既存データと干渉しないよう、未来の期間にテストデータを置き from/to で絞り込む
// （tests/supabase/db-function/get-chat-usage-metrics.test.ts とも干渉しないよう年をずらしている）
const WINDOW_FROM = "2034-01-01T00:00:00.000Z";
const WINDOW_TO = "2034-01-02T00:00:00.000Z";

type MetricsRow =
  Database["public"]["Functions"]["get_chat_usage_metrics"]["Returns"][number];

describe("MCP chat usage tools", () => {
  let registry: TestMcpRegistry;
  let testUser: TestUser;

  beforeEach(async () => {
    registry = createTestRegistry();
    registerChatUsageTools(registry.asMcpServer());
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await adminClient
      .from("chat_usage_events")
      .delete()
      .eq("user_id", testUser.id);
    await cleanupTestUser(testUser.id);
  });

  describe("get_chat_usage_metrics", () => {
    it("期間内のチャット利用状況をprompt_nameごとに返す", async () => {
      expect(registry.hasTool("get_chat_usage_metrics")).toBe(true);

      const { error } = await adminClient.from("chat_usage_events").insert({
        user_id: testUser.id,
        prompt_name: "mcp-test-chat",
        model: "test-model",
        total_tokens: 500,
        cost_usd: 0.05,
        occurred_at: "2034-01-01T12:00:00.000Z",
      });
      if (error) throw new Error(error.message);

      const result = await registry.callTool<MetricsRow[]>(
        "get_chat_usage_metrics",
        { from: WINDOW_FROM, to: WINDOW_TO }
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        prompt_name: "mcp-test-chat",
        event_count: 1,
        unique_user_count: 1,
        total_tokens: 500,
      });
    });
  });
});
