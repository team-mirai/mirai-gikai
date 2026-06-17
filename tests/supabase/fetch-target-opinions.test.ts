import { fetchTargetOpinions } from "@mirai-gikai/topic-analysis-core/repository";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "./utils";

// Supabase/PostgREST の既定行数上限（1000）を超えても全件取得できることを検証する。
const OPINION_COUNT = 1001;

let user: TestUser;
let billId: string;

describe("fetchTargetOpinions ページネーション統合テスト", () => {
  beforeAll(async () => {
    user = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;

    const { data: config } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status: "public", name: "fetch-page-test" })
      .select()
      .single();
    if (!config) throw new Error("config insert failed");

    const { data: session } = await adminClient
      .from("interview_sessions")
      .insert({
        interview_config_id: config.id,
        user_id: user.id,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (!session) throw new Error("session insert failed");

    // §8 フィルタ（管理者公開・ユーザー公開・モデレーションOK）を通すレポート。
    const { data: report } = await adminClient
      .from("interview_report")
      .insert({
        interview_session_id: session.id,
        is_public_by_user: true,
        is_public_by_admin: true,
        moderation_score: 5,
        role: "general_citizen",
        summary: "s",
      })
      .select()
      .single();
    if (!report) throw new Error("report insert failed");

    const rows = Array.from({ length: OPINION_COUNT }, (_, i) => ({
      interview_report_id: report.id,
      opinion_index: i,
      title: `意見${i}`,
      content: `内容${i}`,
    }));
    const { error } = await adminClient.from("interview_opinion").insert(rows);
    if (error) throw new Error(`opinion bulk insert failed: ${error.message}`);
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(user.id);
  });

  it("対象意見が1000件を超えても全件取得する（既定上限で切れない）", async () => {
    const opinions = await fetchTargetOpinions(billId);
    expect(opinions.length).toBe(OPINION_COUNT);
    // opinion_index の取りこぼし・重複が無いこと（0..OPINION_COUNT-1 が一意に揃う）。
    const indices = new Set(opinions.map((o) => o.opinion_index));
    expect(indices.size).toBe(OPINION_COUNT);
  });
});
