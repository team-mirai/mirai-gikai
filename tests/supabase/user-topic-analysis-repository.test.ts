import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createVersion,
  fetchTargetOpinions,
  getTopicsWithOpinions,
  saveTopicsAndAssignments,
  updateVersionStatus,
} from "@mirai-gikai/topic-analysis-core/repository";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "./utils";

/** createVersion は競合時 null を返すため、テストでは非 null を強制する。 */
function expectVersion<T>(v: T | null): T {
  if (!v) throw new Error("createVersion unexpectedly returned null");
  return v;
}

/** session + report + interview_opinion を作る。 */
async function createReportWithOpinions(opts: {
  configId: string;
  userId: string;
  isPublicByUser: boolean;
  moderationScore: number; // <30=ok, 30-69=warning, >=70=ng（generated column）
  opinions: Array<{ title: string; content: string }>;
}): Promise<{ reportId: string; opinionIds: string[] }> {
  const { data: session, error: sErr } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: opts.configId,
      user_id: opts.userId,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (sErr || !session) throw new Error(`session: ${sErr?.message}`);

  const { data: report, error: rErr } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: session.id,
      is_public_by_user: opts.isPublicByUser,
      moderation_score: opts.moderationScore,
      role: "general_citizen",
      summary: "s",
    })
    .select()
    .single();
  if (rErr || !report) throw new Error(`report: ${rErr?.message}`);

  const { data: ops, error: oErr } = await adminClient
    .from("interview_opinion")
    .insert(
      opts.opinions.map((o, i) => ({
        interview_report_id: report.id,
        opinion_index: i,
        title: o.title,
        content: o.content,
      }))
    )
    .select("id");
  if (oErr || !ops) throw new Error(`opinion: ${oErr?.message}`);

  return { reportId: report.id, opinionIds: ops.map((o) => o.id) };
}

describe("user-topic-analysis repository 統合テスト", () => {
  let testUser: TestUser;
  let billId: string;
  let configId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;
    const { data: config, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status: "public", name: "uta-test" })
      .select()
      .single();
    if (error || !config) throw new Error(`config: ${error?.message}`);
    configId = config.id;
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  // one_active_version_per_bill により bill 内 active は1版まで。
  // テスト間で active を残すと次の createVersion が弾かれるため終端させる。
  afterEach(async () => {
    await adminClient
      .from("topic_analysis_version")
      .update({ status: "failed" })
      .eq("bill_id", billId)
      .in("status", ["pending", "running"]);
  });

  it("fetchTargetOpinions は公開同意済み×モデレーションOKの意見だけ返す（§8）", async () => {
    // A: public × ok（含まれる）
    const a = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      moderationScore: 5,
      opinions: [
        { title: "A1", content: "賛成" },
        { title: "A2", content: "懸念" },
      ],
    });
    // B: 非公開（除外）
    await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: false,
      moderationScore: 5,
      opinions: [{ title: "B1", content: "x" }],
    });
    // C: public だが moderation ng（除外）
    await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      moderationScore: 80,
      opinions: [{ title: "C1", content: "y" }],
    });

    const result = await fetchTargetOpinions(billId);
    const ids = result.map((r) => r.opinion_id).sort();
    expect(ids).toEqual([...a.opinionIds].sort());
    expect(result.every((r) => r.role === "general_citizen")).toBe(true);
  });

  it("createVersion は bill 内で連番を振る", async () => {
    const v1 = expectVersion(
      await createVersion(billId, "manual", "test-model", "v1")
    );
    // active は1版までなので、次を作る前に v1 を終端させる。
    await updateVersionStatus(v1.id, "completed");
    const v2 = expectVersion(
      await createVersion(billId, "manual", "test-model", "v1")
    );
    expect(v2.version).toBe(v1.version + 1);
  });

  it("createVersion は active な version が既にあれば null を返す（二重起動ガード）", async () => {
    const first = expectVersion(
      await createVersion(billId, "manual", "test-model", "v1")
    );
    const second = await createVersion(billId, "manual", "test-model", "v1");
    expect(second).toBeNull();
    // first はまだ pending のまま（afterEach で終端される）
    expect(first.status).toBe("pending");
  });

  it("saveTopicsAndAssignments がトピックと割当を保存し、件数降順で取得できる", async () => {
    const { opinionIds } = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      moderationScore: 5,
      opinions: [
        { title: "o1", content: "1" },
        { title: "o2", content: "2" },
        { title: "o3", content: "3" },
      ],
    });
    const version = expectVersion(
      await createVersion(billId, "manual", "m", "v1")
    );

    // topic0 に 2件、topic1 に 1件
    await saveTopicsAndAssignments(
      version.id,
      [
        { title: "多い論点", description: "d0" },
        { title: "少ない論点", description: "d1" },
      ],
      [
        { opinion_id: opinionIds[0], topic_index: 0 },
        { opinion_id: opinionIds[1], topic_index: 0 },
        { opinion_id: opinionIds[2], topic_index: 1 },
      ]
    );

    const topics = await getTopicsWithOpinions(version.id);
    expect(topics.map((t) => t.title)).toEqual(["多い論点", "少ない論点"]);
    expect(topics[0].topic_opinion).toHaveLength(2);
    expect(topics[1].topic_opinion).toHaveLength(1);
  });

  it("topic_opinion の PK で1意見が同一versionで複数トピックに付かない", async () => {
    const { opinionIds } = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      moderationScore: 5,
      opinions: [{ title: "dup", content: "d" }],
    });
    const version = expectVersion(
      await createVersion(billId, "manual", "m", "v1")
    );
    const { data: topics } = await adminClient
      .from("topic")
      .insert([
        {
          version_id: version.id,
          title: "t0",
          description: "d",
          sort_order: 0,
        },
        {
          version_id: version.id,
          title: "t1",
          description: "d",
          sort_order: 1,
        },
      ])
      .select("id");
    if (!topics) throw new Error("topics insert failed");

    await adminClient.from("topic_opinion").insert({
      version_id: version.id,
      opinion_id: opinionIds[0],
      topic_id: topics[0].id,
    });
    // 同一 (version_id, opinion_id) で別 topic → PK 違反
    const { error } = await adminClient.from("topic_opinion").insert({
      version_id: version.id,
      opinion_id: opinionIds[0],
      topic_id: topics[1].id,
    });
    expect(error).not.toBeNull();
  });
});
