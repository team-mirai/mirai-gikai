import {
  countPendingTagExtraction,
  findReportsToTag,
  findUntaggedOpinions,
  markOpinionsTagAttempted,
  resetTagExtractionForBill,
  updateOpinionTags,
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

/**
 * 意見タグ用リポジトリの統合テスト。
 *
 * ここで確かめたいのは PostgREST の実挙動に依存する部分。
 * - `interview_report!inner(interview_sessions!inner(interview_configs!inner(bill_id)))`
 *   という3段ネストの議案フィルタが実際に効くか
 * - レポート単位で束ねる dedup が chunk 件数分のレポートを返すか
 * - compare-and-set（tags_extracted_at IS NULL）が既存タグを上書きしないか
 * これらはユニットテストでは落ちない。
 */

async function createReportWithOpinions(opts: {
  configId: string;
  userId: string;
  isPublicByUser: boolean;
  createdAt: string;
  opinionCount: number;
  tagged?: boolean;
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
      summary: "サマリ",
      stance: "for",
      role: "work_related",
      role_title: "教員",
      opinions: [] as never,
      created_at: opts.createdAt,
    })
    .select()
    .single();
  if (rErr || !report) throw new Error(`report 作成失敗: ${rErr?.message}`);

  const rows = Array.from({ length: opts.opinionCount }, (_, i) => ({
    interview_report_id: report.id,
    opinion_index: i,
    title: `意見${i}`,
    content: `内容${i}`,
    tags_extracted_at: opts.tagged ? opts.createdAt : null,
  }));
  const { error: oErr } = await adminClient
    .from("interview_opinion")
    .insert(rows);
  if (oErr) throw new Error(`opinion 作成失敗: ${oErr.message}`);

  return report;
}

describe("opinion-tags repository 統合テスト", () => {
  let testUser: TestUser;
  let billId: string;
  let configId: string;
  let otherBillId: string;
  let otherConfigId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;
    const { data: config, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status: "public", name: "tag-test" })
      .select()
      .single();
    if (error || !config) throw new Error(`config 作成失敗: ${error?.message}`);
    configId = config.id;

    const otherBill = await createTestBill();
    otherBillId = otherBill.id;
    const { data: otherConfig, error: oErr } = await adminClient
      .from("interview_configs")
      .insert({
        bill_id: otherBillId,
        status: "public",
        name: "tag-test-other",
      })
      .select()
      .single();
    if (oErr || !otherConfig)
      throw new Error(`config 作成失敗: ${oErr?.message}`);
    otherConfigId = otherConfig.id;
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestBill(otherBillId);
    await cleanupTestUser(testUser.id);
  });

  it("reasoning_types は NOT NULL DEFAULT '{}' で入る", async () => {
    const report = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-01-01T00:00:00Z",
      opinionCount: 1,
    });

    const { data } = await adminClient
      .from("interview_opinion")
      .select("reasoning_types, concern, proposal, tags_extracted_at")
      .eq("interview_report_id", report.id)
      .single();

    expect(data?.reasoning_types).toEqual([]);
    expect(data?.concern).toBeNull();
    expect(data?.tags_extracted_at).toBeNull();
  });

  it("countPendingTagExtraction は billId で絞り込める", async () => {
    await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-02-01T00:00:00Z",
      opinionCount: 3,
    });
    await createReportWithOpinions({
      configId: otherConfigId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-02-01T00:00:00Z",
      opinionCount: 2,
    });

    const otherPending = await countPendingTagExtraction(otherBillId);
    expect(otherPending).toBe(2);
  });

  it("findReportsToTag は該当議案の未タグレポートだけを返す", async () => {
    const target = await createReportWithOpinions({
      configId: otherConfigId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-03-01T00:00:00Z",
      opinionCount: 3,
    });
    const alreadyTagged = await createReportWithOpinions({
      configId: otherConfigId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-03-02T00:00:00Z",
      opinionCount: 1,
      tagged: true,
    });

    const reports = await findReportsToTag(50, otherBillId);
    const ids = reports.map((r) => r.reportId);

    expect(ids).toContain(target.id);
    expect(ids).not.toContain(alreadyTagged.id);
    // 立場はプロンプト接地に使うので載っていること
    const found = reports.find((r) => r.reportId === target.id);
    expect(found?.role).toBe("work_related");
    expect(found?.roleTitle).toBe("教員");
  });

  it("findReportsToTag は limit 件のレポートに束ねる（意見数ではない）", async () => {
    // 1レポート3意見 × 2レポートあっても limit=1 ならレポート1件だけ返る
    const reports = await findReportsToTag(1, otherBillId);
    expect(reports).toHaveLength(1);
  });

  it("updateOpinionTags はタグ列だけ更新し、本文を変えない", async () => {
    const report = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-04-01T00:00:00Z",
      opinionCount: 2,
    });

    await updateOpinionTags(
      report.id,
      [
        {
          opinionIndex: 0,
          concern: "健康影響が心配",
          proposal: null,
          reasoningTypes: ["professional_expertise"],
        },
      ],
      "2024-04-02T00:00:00Z"
    );

    const { data } = await adminClient
      .from("interview_opinion")
      .select(
        "opinion_index, title, concern, reasoning_types, tags_extracted_at"
      )
      .eq("interview_report_id", report.id)
      .order("opinion_index");

    expect(data?.[0].title).toBe("意見0");
    expect(data?.[0].concern).toBe("健康影響が心配");
    expect(data?.[0].reasoning_types).toEqual(["professional_expertise"]);
    expect(data?.[0].tags_extracted_at).not.toBeNull();
    // 未指定の意見は触られない
    expect(data?.[1].concern).toBeNull();
    expect(data?.[1].tags_extracted_at).toBeNull();
  });

  // バックフィルは本番稼働中に走るため、対象抽出から更新までの間に
  // ライブ生成が同じ行にタグを書き込むことがある。それを上書きしない。
  it("updateOpinionTags はタグ付け済みの行を上書きしない", async () => {
    const report = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-05-01T00:00:00Z",
      opinionCount: 1,
      tagged: true,
    });
    await adminClient
      .from("interview_opinion")
      .update({ concern: "先に入っていた値" })
      .eq("interview_report_id", report.id);

    await updateOpinionTags(
      report.id,
      [
        {
          opinionIndex: 0,
          concern: "あとから来た値",
          proposal: null,
          reasoningTypes: [],
        },
      ],
      "2024-05-02T00:00:00Z"
    );

    const { data } = await adminClient
      .from("interview_opinion")
      .select("concern")
      .eq("interview_report_id", report.id)
      .single();

    expect(data?.concern).toBe("先に入っていた値");
  });

  it("findUntaggedOpinions は未タグの意見だけを index 昇順で返す", async () => {
    const report = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      createdAt: "2024-06-01T00:00:00Z",
      opinionCount: 3,
    });
    await markOpinionsTagAttempted(report.id, [1], "2024-06-02T00:00:00Z");

    const opinions = await findUntaggedOpinions(report.id);

    expect(opinions.map((o) => o.opinion_index)).toEqual([0, 2]);
  });

  it("resetTagExtractionForBill は該当議案のウォーターマークだけ戻す", async () => {
    const beforeOther = await countPendingTagExtraction(otherBillId);
    const beforeMain = await countPendingTagExtraction(billId);

    const reset = await resetTagExtractionForBill(otherBillId);
    const afterOther = await countPendingTagExtraction(otherBillId);
    const afterMain = await countPendingTagExtraction(billId);

    expect(reset).toBeGreaterThan(0);
    expect(afterOther).toBe(beforeOther + reset);
    // 別議案は影響を受けない
    expect(afterMain).toBe(beforeMain);
  });
});
