import {
  countAllReports,
  countPendingReextraction,
  findReportsToReextract,
  markReextractionAttempted,
  resetReextractionForBill,
} from "@mirai-gikai/topic-analysis-core/repository";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
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

describe("interview-opinion-backfill repository 議案スコープ統合テスト", () => {
  let testUser: TestUser;
  let billA: string;
  let billB: string;
  // bill A のレポート（公開新旧 / 非公開 / 再抽出済み）
  let aPublicOld: string;
  let aPublicNew: string;
  let aPrivate: string;
  let aDone: string;
  // bill B のレポート（混入しないことの検証用）
  let bReport: string;

  async function createConfig(forBillId: string): Promise<string> {
    const { data, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: forBillId, status: "public", name: "scope-test" })
      .select()
      .single();
    if (error || !data) throw new Error(`config 作成失敗: ${error?.message}`);
    return data.id;
  }

  beforeAll(async () => {
    testUser = await createTestUser();
    const ba = await createTestBill();
    const bb = await createTestBill();
    billA = ba.id;
    billB = bb.id;
    const configA = await createConfig(billA);
    const configB = await createConfig(billB);

    const base = { userId: testUser.id };
    aPublicOld = (
      await createReport({
        ...base,
        configId: configA,
        isPublicByUser: true,
        createdAt: "2021-01-01T00:00:00Z",
      })
    ).id;
    aPublicNew = (
      await createReport({
        ...base,
        configId: configA,
        isPublicByUser: true,
        createdAt: "2022-01-01T00:00:00Z",
      })
    ).id;
    aPrivate = (
      await createReport({
        ...base,
        configId: configA,
        isPublicByUser: false,
        createdAt: "2020-01-01T00:00:00Z",
      })
    ).id;
    aDone = (
      await createReport({
        ...base,
        configId: configA,
        isPublicByUser: true,
        createdAt: "2019-01-01T00:00:00Z",
        reextracted: true,
      })
    ).id;
    bReport = (
      await createReport({
        ...base,
        configId: configB,
        isPublicByUser: true,
        createdAt: "2021-06-01T00:00:00Z",
      })
    ).id;
  });

  afterAll(async () => {
    await cleanupTestBill(billA);
    await cleanupTestBill(billB);
    await cleanupTestUser(testUser.id);
  });

  it("findReportsToReextract(billA) は bill A の未処理のみを公開優先・古い順で返す", async () => {
    const ids = (await findReportsToReextract(10000, billA)).map(
      (r) => r.reportId
    );
    // 公開(true)→created_at昇順、その後 非公開。再抽出済み(aDone)と他議案(bReport)は除外。
    expect(ids).toEqual([aPublicOld, aPublicNew, aPrivate]);
    expect(ids).not.toContain(aDone);
    expect(ids).not.toContain(bReport);
  });

  it("countPendingReextraction / countAllReports は議案単位に限定される", async () => {
    expect(await countPendingReextraction(billA)).toBe(3);
    expect(await countAllReports(billA)).toBe(4);
    // 他議案は別カウント（!inner join が件数を変えないことの回帰）
    expect(await countPendingReextraction(billB)).toBe(1);
    expect(await countAllReports(billB)).toBe(1);
  });

  // watermark を変更するため、件数を検証する他テストの後（describe 末尾）に置く。
  it("resetReextractionForBill は bill A の再抽出済みを未再抽出に戻す", async () => {
    // 事前: aDone のみ再抽出済み（pending=3 / total=4）
    expect(await countPendingReextraction(billA)).toBe(3);

    // 再抽出済み(NOT NULL)の行だけ NULL に戻すため、戻り値は aDone の1件。
    const reset = await resetReextractionForBill(billA);
    expect(reset).toBe(1);

    // リセット後は全件が未再抽出 = pending が total と一致する
    expect(await countPendingReextraction(billA)).toBe(4);
    expect(await countAllReports(billA)).toBe(4);
    // 他議案は影響を受けない
    expect(await countPendingReextraction(billB)).toBe(1);
  });
});
