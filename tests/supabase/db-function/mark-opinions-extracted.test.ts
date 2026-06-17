import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestInterviewData,
  createTestUser,
  type TestUser,
} from "../utils";

let user: TestUser;
let billId: string;
let reportId: string;
const opinionIds: string[] = [];

async function insertOpinion(index: number): Promise<string> {
  const { data, error } = await adminClient
    .from("interview_opinion")
    .insert({
      interview_report_id: reportId,
      opinion_index: index,
      title: `意見${index}`,
      content: `内容${index}`,
    })
    .select("id")
    .single();
  if (error) throw new Error(`opinion insert failed: ${error.message}`);
  return data.id;
}

async function extractedAtById(): Promise<Map<string, string | null>> {
  const { data } = await adminClient
    .from("interview_opinion")
    .select("id, topic_extracted_at")
    .in("id", opinionIds);
  return new Map((data ?? []).map((r) => [r.id, r.topic_extracted_at]));
}

describe("mark_opinions_extracted()", () => {
  beforeAll(async () => {
    user = await createTestUser();
    const { bill, session } = await createTestInterviewData(user.id);
    billId = bill.id;
    const { data: report, error } = await adminClient
      .from("interview_report")
      .insert({ interview_session_id: session.id })
      .select("id")
      .single();
    if (error) throw new Error(`report insert failed: ${error.message}`);
    reportId = report.id;
    opinionIds.push(await insertOpinion(0));
    opinionIds.push(await insertOpinion(1));
    opinionIds.push(await insertOpinion(2));
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(user.id);
  });

  it("指定した意見だけ topic_extracted_at を一括更新し、他は触らない", async () => {
    const at = "2026-06-16T00:00:00Z";
    const r = await adminClient.rpc("mark_opinions_extracted", {
      p_ids: [opinionIds[0], opinionIds[1]],
      p_extracted_at: at,
    });
    expect(r.error).toBeNull();

    const map = await extractedAtById();
    // 指定した2件は更新される
    expect(new Date(map.get(opinionIds[0]) ?? 0).getTime()).toBe(
      new Date(at).getTime()
    );
    expect(new Date(map.get(opinionIds[1]) ?? 0).getTime()).toBe(
      new Date(at).getTime()
    );
    // 指定していない1件は null のまま
    expect(map.get(opinionIds[2])).toBeNull();
  });

  it("空配列では何も更新しない", async () => {
    const r = await adminClient.rpc("mark_opinions_extracted", {
      p_ids: [],
      p_extracted_at: "2026-06-16T01:00:00Z",
    });
    expect(r.error).toBeNull();
    const map = await extractedAtById();
    // 3件目は依然 null（影響を受けない）
    expect(map.get(opinionIds[2])).toBeNull();
  });
});
