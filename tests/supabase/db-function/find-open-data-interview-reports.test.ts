import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "../utils";

async function createTestInterviewConfig(billId: string) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({
      bill_id: billId,
      status: "public",
      name: `テスト設定 ${Date.now()}`,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);
  return data;
}

async function createTestSession(configId: string, userId: string) {
  const { data, error } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`interview_session 作成失敗: ${error.message}`);
  return data;
}

async function createTestReport(
  sessionId: string,
  overrides: Partial<{
    is_public_by_user: boolean;
    is_public_by_admin: boolean;
    is_data_reuse_consented: boolean;
    summary: string;
    opinions: unknown;
    created_at: string;
  }> = {}
) {
  const { data, error } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: sessionId,
      ...overrides,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_report 作成失敗: ${error.message}`);
  return data;
}

async function findOpenData(params: {
  minPublicReports?: number;
  limit?: number;
  cursorCreatedAt?: string;
  cursorId?: string;
}) {
  const { data, error } = await adminClient.rpc(
    "find_open_data_interview_reports",
    {
      p_min_public_reports: params.minPublicReports ?? 1,
      p_limit: params.limit ?? 100,
      ...(params.cursorCreatedAt
        ? { p_cursor_created_at: params.cursorCreatedAt }
        : {}),
      ...(params.cursorId ? { p_cursor_id: params.cursorId } : {}),
    }
  );
  if (error) {
    throw new Error(`find_open_data_interview_reports 失敗: ${error.message}`);
  }
  return data ?? [];
}

describe("find_open_data_interview_reports", () => {
  let testUser: TestUser;
  const billIds: string[] = [];

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
    await cleanupTestUser(testUser.id);
  });

  it("公開×二次利用許諾のレポートのみ返し、許諾なし・非公開は除外する", async () => {
    const bill = await createTestBill({ publish_status: "published" });
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const consented = await createTestSession(config.id, testUser.id);
    await createTestReport(consented.id, {
      is_public_by_user: true,
      is_public_by_admin: true,
      is_data_reuse_consented: true,
      summary: "許諾あり",
      opinions: [{ title: "意見", content: "本文" }],
    });

    const notConsented = await createTestSession(config.id, testUser.id);
    await createTestReport(notConsented.id, {
      is_public_by_user: true,
      is_public_by_admin: true,
      is_data_reuse_consented: false,
      summary: "許諾なし",
    });

    const notPublic = await createTestSession(config.id, testUser.id);
    await createTestReport(notPublic.id, {
      is_public_by_user: false,
      is_public_by_admin: true,
      is_data_reuse_consented: true,
      summary: "非公開",
    });

    const rows = await findOpenData({});
    const summaries = rows.map((r) => r.summary);

    expect(summaries).toContain("許諾あり");
    expect(summaries).not.toContain("許諾なし");
    expect(summaries).not.toContain("非公開");

    const row = rows.find((r) => r.summary === "許諾あり");
    expect(row?.bill_id).toBe(bill.id);
    expect(row?.bill_name).toBe(bill.name);
    expect(row?.opinions).toEqual([{ title: "意見", content: "本文" }]);
  });

  it("公開レポート数が閾値未満の議案は除外する（k-匿名性ゲート）", async () => {
    const bill = await createTestBill({ publish_status: "published" });
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session = await createTestSession(config.id, testUser.id);
    await createTestReport(session.id, {
      is_public_by_user: true,
      is_public_by_admin: true,
      is_data_reuse_consented: true,
      summary: "ゲート対象",
    });

    const withThreshold2 = await findOpenData({ minPublicReports: 2 });
    expect(withThreshold2.map((r) => r.summary)).not.toContain("ゲート対象");

    const withThreshold1 = await findOpenData({ minPublicReports: 1 });
    expect(withThreshold1.map((r) => r.summary)).toContain("ゲート対象");
  });

  it("非公開議案（draft）のレポートは除外する", async () => {
    const bill = await createTestBill({ publish_status: "draft" });
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const session = await createTestSession(config.id, testUser.id);
    await createTestReport(session.id, {
      is_public_by_user: true,
      is_public_by_admin: true,
      is_data_reuse_consented: true,
      summary: "非公開議案",
    });

    const rows = await findOpenData({});
    expect(rows.map((r) => r.summary)).not.toContain("非公開議案");
  });

  it("新しい順に返り、カーソル以降のページを取得できる", async () => {
    const bill = await createTestBill({ publish_status: "published" });
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const summaries = ["古い", "中間", "新しい"];
    for (const [index, summary] of summaries.entries()) {
      const session = await createTestSession(config.id, testUser.id);
      await createTestReport(session.id, {
        is_public_by_user: true,
        is_public_by_admin: true,
        is_data_reuse_consented: true,
        summary,
        created_at: `2026-07-0${index + 1}T00:00:00.000Z`,
      });
    }

    // ローカルDBには他の条件合致データが存在し得るため、
    // このテストの議案の行だけに絞って順序とカーソル動作を検証する
    const allRows = await findOpenData({ limit: 1000 });
    const ownRows = allRows.filter((r) => r.bill_id === bill.id);
    expect(ownRows.map((r) => r.summary)).toEqual(["新しい", "中間", "古い"]);

    const middle = ownRows[1];
    const afterCursor = await findOpenData({
      limit: 1000,
      cursorCreatedAt: middle?.created_at,
      cursorId: middle?.report_id,
    });
    const ownAfterCursor = afterCursor.filter((r) => r.bill_id === bill.id);
    expect(ownAfterCursor.map((r) => r.summary)).toEqual(["古い"]);
  });
});
