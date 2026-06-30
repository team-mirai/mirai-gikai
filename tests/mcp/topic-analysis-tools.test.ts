import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerTopicAnalysisTools } from "../../admin/src/features/mcp/server/tools/register-topic-analysis-tools";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

/**
 * session + report + interview_opinion を1件作り、{ reportId, opinionId } を返す。
 * roleDescription / messages を渡すと立場説明・会話ログも投入する。
 */
async function createReportWithOpinion(opts: {
  configId: string;
  userId: string;
  isPublicByUser: boolean;
  isPublicByAdmin: boolean;
  role: string;
  stance?: string;
  title: string;
  billSentiment?: string;
  roleDescription?: string;
  messages?: Array<{ role: "assistant" | "user"; content: string }>;
}): Promise<{ reportId: string; opinionId: string }> {
  const { data: session } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: opts.configId,
      user_id: opts.userId,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (!session) throw new Error("session insert failed");

  const { data: report } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: session.id,
      is_public_by_user: opts.isPublicByUser,
      is_public_by_admin: opts.isPublicByAdmin,
      moderation_score: 5,
      role: opts.role,
      role_title: "育休経験者",
      role_description: opts.roleDescription ?? null,
      stance: opts.stance ?? null,
      summary: `${opts.title}の要約`,
    })
    .select()
    .single();
  if (!report) throw new Error("report insert failed");

  if (opts.messages?.length) {
    const { error: messagesError } = await adminClient
      .from("interview_messages")
      .insert(
        opts.messages.map((m) => ({
          interview_session_id: session.id,
          role: m.role,
          content: m.content,
        }))
      );
    if (messagesError) throw new Error("messages insert failed");
  }

  const { data: opinion } = await adminClient
    .from("interview_opinion")
    .insert({
      interview_report_id: report.id,
      opinion_index: 0,
      title: opts.title,
      content: `${opts.title}の本文`,
      bill_sentiment: opts.billSentiment ?? null,
    })
    .select("id")
    .single();
  if (!opinion) throw new Error("opinion insert failed");
  return { reportId: report.id, opinionId: opinion.id };
}

/**
 * 件数ゲート用に、最小構成の公開レポート（session + report）を n 件まとめて作る。
 * k-匿名性しきい値（公開レポート >= 20 件）を満たすための水増しに使う。
 */
async function createPublicReports(
  configId: string,
  userId: string,
  n: number
): Promise<void> {
  const now = new Date().toISOString();
  const { data: sessions } = await adminClient
    .from("interview_sessions")
    .insert(
      Array.from({ length: n }, () => ({
        interview_config_id: configId,
        user_id: userId,
        started_at: now,
        completed_at: now,
      }))
    )
    .select("id");
  if (!sessions) throw new Error("sessions insert failed");

  const { error } = await adminClient.from("interview_report").insert(
    sessions.map((s) => ({
      interview_session_id: s.id,
      is_public_by_user: true,
      is_public_by_admin: true,
      moderation_score: 5,
      role: "general_citizen",
      summary: "件数ゲート用",
    }))
  );
  if (error) throw new Error("reports insert failed");
}

describe("MCP topic-analysis tools（内部向け・識別子フリー読み取り）", () => {
  let registry: TestMcpRegistry;
  let testUser: TestUser;
  let billWithAnalysis: string;
  let billWithout: string;
  let publicReportId: string;
  let privateReportId: string;
  // 公開レポート >= 20 件で k-匿名性ゲートを通過する議案と、その詳細対象レポート
  let billDisplayable: string;
  let detailReportId: string;

  beforeAll(async () => {
    registry = createTestRegistry();
    registerTopicAnalysisTools(registry.asMcpServer());

    testUser = await createTestUser();

    const bill = await createTestBill();
    billWithAnalysis = bill.id;
    const { data: config } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billWithAnalysis, status: "public", name: "mcp-ta" })
      .select()
      .single();
    if (!config) throw new Error("config insert failed");

    // §8 を通る公開意見 / ユーザー非公開 / 管理者非公開 の3件
    const ok = await createReportWithOpinion({
      configId: config.id,
      userId: testUser.id,
      isPublicByUser: true,
      isPublicByAdmin: true,
      role: "daily_life_affected",
      stance: "for",
      title: "公開OK",
      billSentiment: "期待",
      roleDescription: "育休を取得した当事者です",
      messages: [
        { role: "assistant", content: "この法案についてどう思いますか？" },
        { role: "user", content: "賛成です。負担が軽くなります" },
      ],
    });
    publicReportId = ok.reportId;
    const userPrivate = await createReportWithOpinion({
      configId: config.id,
      userId: testUser.id,
      isPublicByUser: false,
      isPublicByAdmin: true,
      role: "general_citizen",
      title: "ユーザー非公開",
    });
    privateReportId = userPrivate.reportId;
    const adminPrivate = await createReportWithOpinion({
      configId: config.id,
      userId: testUser.id,
      isPublicByUser: true,
      isPublicByAdmin: false,
      role: "general_citizen",
      title: "管理者非公開",
    });

    const { data: version } = await adminClient
      .from("topic_analysis_version")
      .insert({
        bill_id: billWithAnalysis,
        version: 1,
        status: "completed",
        trigger: "manual",
        is_published: true,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (!version) throw new Error("version insert failed");

    const { data: topic } = await adminClient
      .from("topic")
      .insert({
        version_id: version.id,
        title: "論点A",
        description: "desc",
        sort_order: 0,
      })
      .select()
      .single();
    if (!topic) throw new Error("topic insert failed");

    await adminClient.from("topic_opinion").insert([
      { version_id: version.id, topic_id: topic.id, opinion_id: ok.opinionId },
      {
        version_id: version.id,
        topic_id: topic.id,
        opinion_id: userPrivate.opinionId,
      },
      {
        version_id: version.id,
        topic_id: topic.id,
        opinion_id: adminPrivate.opinionId,
      },
    ]);

    const bill2 = await createTestBill();
    billWithout = bill2.id;

    // k-匿名性ゲートを通過する議案（公開レポート 20 件）。
    // 詳細対象 1 件（立場説明＋会話ログ）＋ 件数水増し 19 件 = 20 件。
    const bill3 = await createTestBill();
    billDisplayable = bill3.id;
    const { data: config3 } = await adminClient
      .from("interview_configs")
      .insert({
        bill_id: billDisplayable,
        status: "public",
        name: "mcp-detail",
      })
      .select()
      .single();
    if (!config3) throw new Error("config3 insert failed");

    const detail = await createReportWithOpinion({
      configId: config3.id,
      userId: testUser.id,
      isPublicByUser: true,
      isPublicByAdmin: true,
      role: "daily_life_affected",
      stance: "for",
      title: "詳細対象",
      billSentiment: "期待",
      roleDescription: "育休を取得した当事者です",
      messages: [
        { role: "assistant", content: "この法案についてどう思いますか？" },
        { role: "user", content: "賛成です。負担が軽くなります" },
      ],
    });
    detailReportId = detail.reportId;
    await createPublicReports(config3.id, testUser.id, 19);
  });

  afterAll(async () => {
    if (billWithAnalysis) await cleanupTestBill(billWithAnalysis);
    if (billWithout) await cleanupTestBill(billWithout);
    if (billDisplayable) await cleanupTestBill(billDisplayable);
    if (testUser?.id) await cleanupTestUser(testUser.id);
  });

  it("登録されているツール名が想定通り", () => {
    expect(registry.toolNames().sort()).toEqual(
      ["get_topic_analysis", "list_respondents", "get_respondent_detail"].sort()
    );
  });

  describe("get_topic_analysis", () => {
    it("既定（フィルタ無し）では公開・非公開を問わず全意見を返す", async () => {
      const result = await registry.callTool<{
        topics: Array<{
          opinion_count: number;
          affected_count: number;
          citizen_count: number;
          sentiment: { 期待: number; 懸念: number };
        }>;
        total_opinions: number;
      }>("get_topic_analysis", { billId: billWithAnalysis });

      // ok（公開）/ ユーザー非公開 / 管理者非公開 の3意見すべて。
      expect(result.total_opinions).toBe(3);
      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].opinion_count).toBe(3);
      expect(result.topics[0].affected_count).toBe(1);
      expect(result.topics[0].citizen_count).toBe(2);
      expect(result.topics[0].sentiment).toEqual({ 期待: 1, 懸念: 0 });
    });

    it("公開フラグ＋モデレーションOKで絞り込める", async () => {
      const result = await registry.callTool<{
        topics: Array<{
          opinion_count: number;
          opinions: Array<{ title: string }>;
        }>;
        total_opinions: number;
      }>("get_topic_analysis", {
        billId: billWithAnalysis,
        isPublicByAdmin: true,
        isPublicByUser: true,
        moderationStatus: "ok",
      });

      expect(result.total_opinions).toBe(1);
      expect(result.topics[0].opinion_count).toBe(1);
      expect(result.topics[0].opinions[0].title).toBe("公開OK");
    });

    it("requireDisplayThreshold 指定時、公開20件未満なら status=not_ready", async () => {
      const result = await registry.callTool<{ status: string }>(
        "get_topic_analysis",
        { billId: billWithAnalysis, requireDisplayThreshold: true }
      );
      expect(result.status).toBe("not_ready");
    });

    it("個人情報（user_id・email・session）を返さない", async () => {
      const result = await registry.callTool("get_topic_analysis", {
        billId: billWithAnalysis,
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user_id");
      expect(serialized).not.toContain("email");
      expect(serialized).not.toContain("interview_session");
      expect(serialized).not.toContain(testUser.id);
    });

    it("版が無ければ status=not_ready を返す", async () => {
      const result = await registry.callTool<{ status: string }>(
        "get_topic_analysis",
        { billId: billWithout }
      );
      expect(result.status).toBe("not_ready");
    });
  });

  describe("list_respondents", () => {
    it("既定（フィルタ無し）では公開・非公開を問わず全件返す", async () => {
      const result = await registry.callTool<Array<{ id: string }>>(
        "list_respondents",
        { billId: billWithAnalysis }
      );
      const ids = result.map((r) => r.id);
      expect(ids).toContain(publicReportId);
      expect(ids).toContain(privateReportId);
    });

    it("公開フラグで絞り込める", async () => {
      const result = await registry.callTool<
        Array<{ id: string; summary: string | null; bill_sentiment: unknown }>
      >("list_respondents", {
        billId: billWithAnalysis,
        isPublicByAdmin: true,
        isPublicByUser: true,
      });

      const ids = result.map((r) => r.id);
      expect(ids).toContain(publicReportId);
      expect(ids).not.toContain(privateReportId);
      const pub = result.find((r) => r.id === publicReportId);
      expect(pub?.summary).toBe("公開OKの要約");
      expect(pub?.bill_sentiment).toBe("期待");
    });

    it("requireDisplayThreshold 指定時、公開20件未満なら status=below_threshold", async () => {
      const result = await registry.callTool<{ status: string }>(
        "list_respondents",
        { billId: billWithAnalysis, requireDisplayThreshold: true }
      );
      expect(result.status).toBe("below_threshold");
    });

    it("個人情報（user_id・email・session）を返さない", async () => {
      const result = await registry.callTool("list_respondents", {
        billId: billWithAnalysis,
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user_id");
      expect(serialized).not.toContain("email");
      expect(serialized).not.toContain("interview_session");
      expect(serialized).not.toContain(testUser.id);
    });
  });

  describe("get_respondent_detail", () => {
    it("既定（フィルタ無し）では公開条件に関わらず立場説明と会話ログを返す", async () => {
      const result = await registry.callTool<{
        id: string;
        user_category: string;
        role_description: string | null;
        bill_sentiment: unknown;
        messages: Array<{ speaker: string; content: string }>;
      }>("get_respondent_detail", { reportId: publicReportId });

      expect(result.id).toBe(publicReportId);
      expect(result.user_category).toBe("affected");
      expect(result.role_description).toBe("育休を取得した当事者です");
      expect(result.bill_sentiment).toBe("期待");
      expect(
        result.messages.map((m) => ({ speaker: m.speaker, content: m.content }))
      ).toEqual([
        { speaker: "assistant", content: "この法案についてどう思いますか？" },
        { speaker: "user", content: "賛成です。負担が軽くなります" },
      ]);
    });

    it("既定では非公開レポートも返す（内部向け）", async () => {
      const result = await registry.callTool<{ id?: string; status?: string }>(
        "get_respondent_detail",
        { reportId: privateReportId }
      );
      expect(result.id).toBe(privateReportId);
      expect(result.status).toBeUndefined();
    });

    it("公開フラグフィルタで非公開レポートを除外できる（status=not_found）", async () => {
      const result = await registry.callTool<{ status: string }>(
        "get_respondent_detail",
        { reportId: privateReportId, isPublicByUser: true }
      );
      expect(result.status).toBe("not_found");
    });

    it("requireDisplayThreshold 指定時、公開20件未満は status=not_found", async () => {
      const result = await registry.callTool<{ status: string }>(
        "get_respondent_detail",
        { reportId: publicReportId, requireDisplayThreshold: true }
      );
      expect(result.status).toBe("not_found");
    });

    it("requireDisplayThreshold 指定でも公開20件以上の議案は詳細を返す", async () => {
      const result = await registry.callTool<{ id?: string; status?: string }>(
        "get_respondent_detail",
        { reportId: detailReportId, requireDisplayThreshold: true }
      );
      expect(result.id).toBe(detailReportId);
      expect(result.status).toBeUndefined();
    });

    it("個人情報（user_id・email・session）を返さない", async () => {
      const result = await registry.callTool("get_respondent_detail", {
        reportId: detailReportId,
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user_id");
      expect(serialized).not.toContain("email");
      expect(serialized).not.toContain("interview_session");
      expect(serialized).not.toContain(testUser.id);
    });
  });
});
