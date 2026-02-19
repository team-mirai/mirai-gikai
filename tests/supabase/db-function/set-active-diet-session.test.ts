import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestDietSession,
  cleanupTestDietSession,
} from "../utils";

describe("set_active_diet_session() 関数", () => {
  let sessionIds: string[] = [];

  beforeEach(async () => {
    sessionIds = [];
  });

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
  });

  it("指定したセッションのみ active になる", async () => {
    const a = await createTestDietSession({
      slug: `test-a-${Date.now()}`,
    });
    const b = await createTestDietSession({
      slug: `test-b-${Date.now()}`,
    });
    const c = await createTestDietSession({
      slug: `test-c-${Date.now()}`,
    });
    sessionIds.push(a.id, b.id, c.id);

    await adminClient.rpc("set_active_diet_session", {
      target_session_id: b.id,
    });

    const { data } = await adminClient
      .from("diet_sessions")
      .select("id, is_active")
      .in("id", [a.id, b.id, c.id]);

    const findById = (id: string) => data?.find((d) => d.id === id);
    expect(findById(a.id)?.is_active).toBe(false);
    expect(findById(b.id)?.is_active).toBe(true);
    expect(findById(c.id)?.is_active).toBe(false);
  });

  it("active を別のセッションにアトミックに切り替えられる", async () => {
    const a = await createTestDietSession({
      slug: `test-a-${Date.now()}`,
      is_active: true,
    });
    const b = await createTestDietSession({
      slug: `test-b-${Date.now()}`,
    });
    sessionIds.push(a.id, b.id);

    // a が active な状態で b に切り替え
    await adminClient.rpc("set_active_diet_session", {
      target_session_id: b.id,
    });

    const { data } = await adminClient
      .from("diet_sessions")
      .select("id, is_active")
      .in("id", [a.id, b.id]);

    const findById = (id: string) => data?.find((d) => d.id === id);
    expect(findById(a.id)?.is_active).toBe(false);
    expect(findById(b.id)?.is_active).toBe(true);
  });

  it("存在しない UUID を指定すると全セッションが非 active になる", async () => {
    const a = await createTestDietSession({
      slug: `test-a-${Date.now()}`,
      is_active: true,
    });
    sessionIds.push(a.id);

    await adminClient.rpc("set_active_diet_session", {
      target_session_id: "00000000-0000-0000-0000-000000000000",
    });

    const { data } = await adminClient
      .from("diet_sessions")
      .select("id, is_active")
      .eq("id", a.id)
      .single();

    expect(data?.is_active).toBe(false);
  });
});
