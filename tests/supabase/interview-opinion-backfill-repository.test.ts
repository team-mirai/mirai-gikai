import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  countPendingReextraction,
  findReportsToReextract,
  markReextractionAttempted,
  updateReportOpinions,
} from "@mirai-gikai/topic-analysis-core/repository";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  type TestUser,
  createTestUser,
} from "./utils";

/** 共有 config 配下に session + report を1件作る。 */
async function createReport(opts: {
  configId: string;
  userId: string;
  isPublicByUser: boolean;
  createdAt: string;
  reextracted?: boolean;
  opinions?: unknown;
  summary?: string;
}) {
  const { data: session, error: sErr } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: opts.configId,
      user_id: opts.userId,
      started_at: opts.createdAt,
      completed_at: opts.createdAt,
    })
    .select()
    .single();
  if (sErr || !session) throw new Error(`session 作成失敗: ${sErr?.message}`);

  const { data: report, error: rErr } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: session.id,
      is_public_by_user: opts.isPublicByUser,
      summary: opts.summary ?? "元サマリ",
      stance: "for",
      opinions: (opts.opinions ?? []) as never,
      created_at: opts.createdAt,
      opinions_reextracted_at: opts.reextracted ? opts.createdAt : null,
    })
    .select()
    .single();
  if (rErr || !report) throw new Error(`report 作成失敗: ${rErr?.message}`);
  return report;
}

describe("interview-opinion-backfill repository 統合テスト", () => {
  let testUser: TestUser;
  let billId: string;
  let configId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;
    const { data: config, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status: "public", name: "backfill-test" })
      .select()
      .single();
    if (error || !config) throw new Error(`config 作成失敗: ${error?.message}`);
    configId = config.id;
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("findReportsToReextract は公開同意優先・古い順で未処理のみ返す", async () => {
    const publicOld = await createReport({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2021-01-01T00:00:00Z",
    });
    const publicNew = await createReport({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2022-01-01T00:00:00Z",
    });
    const privateOldest = await createReport({
      configId,
      userId: testUser.id,
      isPublicByUser: false,
      createdAt: "2020-01-01T00:00:00Z",
    });
    const alreadyDone = await createReport({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2019-01-01T00:00:00Z",
      reextracted: true,
    });

    // グローバルクエリのため、自分の作成分だけに絞って検証する
    const myIds = new Set([
      publicOld.id,
      publicNew.id,
      privateOldest.id,
      alreadyDone.id,
    ]);
    const all = await findReportsToReextract(10000);
    const mine = all.filter((r) => myIds.has(r.reportId));

    // 再抽出済み(alreadyDone)は含まれない
    expect(mine.map((r) => r.reportId)).not.toContain(alreadyDone.id);
    // 公開優先 → 同一公開区分は created_at 昇順
    expect(mine.map((r) => r.reportId)).toEqual([
      publicOld.id,
      publicNew.id,
      privateOldest.id,
    ]);
  });

  it("updateReportOpinions は opinions と処理時刻のみ更新し他カラムは保持する", async () => {
    const report = await createReport({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2023-01-01T00:00:00Z",
      summary: "保持されるサマリ",
      opinions: [{ title: "旧", content: "旧内容", source_message_id: null }],
    });

    const newOpinions = [
      {
        title: "新意見",
        content: "新内容",
        source_message_id: null,
        contextual_quote: "（議案について）新引用",
        bill_sentiment: "期待",
        source_message_content: null,
      },
    ];
    const iso = "2026-06-08T00:00:00Z";
    await updateReportOpinions(report.id, newOpinions, iso);

    const { data: updated } = await adminClient
      .from("interview_report")
      .select("opinions, opinions_reextracted_at, summary, stance")
      .eq("id", report.id)
      .single();

    expect(updated?.opinions).toEqual(newOpinions);
    expect(new Date(updated?.opinions_reextracted_at ?? 0).getTime()).toBe(
      new Date(iso).getTime()
    );
    // 他フィールドは不変
    expect(updated?.summary).toBe("保持されるサマリ");
    expect(updated?.stance).toBe("for");
  });

  it("countPendingReextraction は markReextractionAttempted で減る", async () => {
    const report = await createReport({
      configId,
      userId: testUser.id,
      isPublicByUser: false,
      createdAt: "2024-01-01T00:00:00Z",
    });

    const before = await countPendingReextraction();
    await markReextractionAttempted(report.id, "2026-06-08T01:00:00Z");
    const after = await countPendingReextraction();

    expect(after).toBe(before - 1);

    // opinions は変えずに処理時刻だけ記録されている
    const { data: row } = await adminClient
      .from("interview_report")
      .select("opinions_reextracted_at")
      .eq("id", report.id)
      .single();
    expect(new Date(row?.opinions_reextracted_at ?? 0).getTime()).toBe(
      new Date("2026-06-08T01:00:00Z").getTime()
    );
  });
});
