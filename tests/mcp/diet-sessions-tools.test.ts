import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerDietSessionsTools } from "../../admin/src/features/mcp/server/tools/register-diet-sessions-tools";
import {
  cleanupTestDietSession,
  createTestDietSession,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

describe("MCP diet_sessions tools", () => {
  let registry: TestMcpRegistry;
  const dietSessionIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerDietSessionsTools(registry.asMcpServer());
  });

  afterEach(async () => {
    for (const id of dietSessionIds.splice(0)) await cleanupTestDietSession(id);
  });

  describe("list_diet_sessions", () => {
    it("登録済みの会期を start_date 降順で返す", async () => {
      const older = await createTestDietSession({
        name: `古い会期-${Date.now()}`,
        start_date: "2020-01-01",
        end_date: "2020-06-30",
      });
      const newer = await createTestDietSession({
        name: `新しい会期-${Date.now()}`,
        start_date: "2030-01-01",
        end_date: "2030-06-30",
      });
      dietSessionIds.push(older.id, newer.id);

      const result =
        await registry.callTool<
          Array<{ id: string; name: string; start_date: string }>
        >("list_diet_sessions");

      const ids = result.map((s) => s.id);
      const newerIdx = ids.indexOf(newer.id);
      const olderIdx = ids.indexOf(older.id);
      expect(newerIdx).toBeGreaterThanOrEqual(0);
      expect(olderIdx).toBeGreaterThanOrEqual(0);
      // start_date 降順なので newer の方が前に来る
      expect(newerIdx).toBeLessThan(olderIdx);
    });
  });

  it("登録されているツール名が想定通り", () => {
    expect(registry.toolNames()).toEqual(["list_diet_sessions"]);
  });
});
