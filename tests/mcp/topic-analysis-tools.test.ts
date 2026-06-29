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

describe("MCP topic-analysis tools（公開・PIIセーフ読み取り）", () => {
  let registry: TestMcpRegistry;
  let testUser: TestUser;
  let billWithAnalysis: string;
  let billWithout: string;
  let publicReportId: string;
  let privateReportId: string;

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
  });

  afterAll(async () => {
    if (billWithAnalysis) await cleanupTestBill(billWithAnalysis);
    if (billWithout) await cleanupTestBill(billWithout);
    if (testUser?.id) await cleanupTestUser(testUser.id);
  });

  it("登録されているツール名が想定通り", () => {
    expect(registry.toolNames().sort()).toEqual(
      [
        "get_public_topic_analysis",
        "list_public_respondents",
        "get_respondent_detail",
      ].sort()
    );
  });

  describe("get_public_topic_analysis", () => {
    it("§8 を通る公開意見のみ返し、件数も再計算する", async () => {
      const result = await registry.callTool<{
        topics: Array<{
          opinion_count: number;
          affected_count: number;
          sentiment: { 期待: number; 懸念: number };
          opinions: Array<{ title: string }>;
        }>;
        total_opinions: number;
      }>("get_public_topic_analysis", { billId: billWithAnalysis });

      expect(result.total_opinions).toBe(1);
      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].opinion_count).toBe(1);
      expect(result.topics[0].affected_count).toBe(1);
      expect(result.topics[0].sentiment).toEqual({ 期待: 1, 懸念: 0 });
      expect(result.topics[0].opinions[0].title).toBe("公開OK");
    });

    it("個人情報（user_id・email・session）を返さない", async () => {
      const result = await registry.callTool("get_public_topic_analysis", {
        billId: billWithAnalysis,
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user_id");
      expect(serialized).not.toContain("email");
      expect(serialized).not.toContain("interview_session");
      expect(serialized).not.toContain(testUser.id);
    });

    it("公開版が無ければ status=not_ready を返す", async () => {
      const result = await registry.callTool<{ status: string }>(
        "get_public_topic_analysis",
        { billId: billWithout }
      );
      expect(result.status).toBe("not_ready");
    });
  });

  describe("list_public_respondents", () => {
    it("公開（管理者公開×ユーザー公開）のレポートのみ返す", async () => {
      const result = await registry.callTool<
        Array<{ id: string; summary: string | null; bill_sentiment: unknown }>
      >("list_public_respondents", { billId: billWithAnalysis });

      const ids = result.map((r) => r.id);
      expect(ids).toContain(publicReportId);
      expect(ids).not.toContain(privateReportId);
      const pub = result.find((r) => r.id === publicReportId);
      expect(pub?.summary).toBe("公開OKの要約");
      expect(pub?.bill_sentiment).toBe("期待");
    });

    it("個人情報（user_id・email）を返さない", async () => {
      const result = await registry.callTool("list_public_respondents", {
        billId: billWithAnalysis,
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user_id");
      expect(serialized).not.toContain("email");
      expect(serialized).not.toContain(testUser.id);
    });
  });

  describe("get_respondent_detail", () => {
    it("公開レポートの立場説明と会話ログを返す", async () => {
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

    it("非公開レポートは status=not_found を返す", async () => {
      const result = await registry.callTool<{ status: string }>(
        "get_respondent_detail",
        { reportId: privateReportId }
      );
      expect(result.status).toBe("not_found");
    });

    it("個人情報（user_id・email・session）を返さない", async () => {
      const result = await registry.callTool("get_respondent_detail", {
        reportId: publicReportId,
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("user_id");
      expect(serialized).not.toContain("email");
      expect(serialized).not.toContain("interview_session");
      expect(serialized).not.toContain(testUser.id);
    });
  });
});
