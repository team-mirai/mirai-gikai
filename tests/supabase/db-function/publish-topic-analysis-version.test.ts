import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminClient, cleanupTestBill, createTestBill } from "../utils";

let billId: string;

async function insertVersion(version: number): Promise<string> {
  const { data, error } = await adminClient
    .from("topic_analysis_version")
    .insert({
      bill_id: billId,
      version,
      status: "completed",
      trigger: "manual",
    })
    .select("id")
    .single();
  if (error) throw new Error(`version insert failed: ${error.message}`);
  return data.id;
}

async function publishedIds(): Promise<string[]> {
  const { data } = await adminClient
    .from("topic_analysis_version")
    .select("id")
    .eq("bill_id", billId)
    .eq("is_published", true);
  return (data ?? []).map((r) => r.id);
}

describe("publish_topic_analysis_version()", () => {
  beforeEach(async () => {
    const bill = await createTestBill();
    billId = bill.id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
  });

  it("対象を公開し、同 bill の旧公開版は降ろす（公開は常に1版）", async () => {
    const v1 = await insertVersion(1);
    const v2 = await insertVersion(2);

    const r1 = await adminClient.rpc("publish_topic_analysis_version", {
      p_version_id: v1,
    });
    expect(r1.error).toBeNull();
    expect(await publishedIds()).toEqual([v1]);

    const r2 = await adminClient.rpc("publish_topic_analysis_version", {
      p_version_id: v2,
    });
    expect(r2.error).toBeNull();
    // v1 は降ろされ、公開は v2 の1版のみ
    expect(await publishedIds()).toEqual([v2]);
  });

  it("既に公開中の版を再公開しても1版のまま（冪等）", async () => {
    const v1 = await insertVersion(1);
    await adminClient.rpc("publish_topic_analysis_version", {
      p_version_id: v1,
    });
    const r = await adminClient.rpc("publish_topic_analysis_version", {
      p_version_id: v1,
    });
    expect(r.error).toBeNull();
    expect(await publishedIds()).toEqual([v1]);
  });

  it("存在しない version_id は例外を返す", async () => {
    const { error } = await adminClient.rpc("publish_topic_analysis_version", {
      p_version_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });
});
