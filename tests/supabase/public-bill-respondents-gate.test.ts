import {
  findPublicBillRespondentRows,
  getPublicBillRespondents,
} from "@mirai-gikai/topic-analysis-core/public-server";
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
 * 回答一覧（getPublicBillRespondents）の公開条件 統合テスト。
 *
 * かつては公開レポート20件未満の議案を隠す k-匿名性ゲートがあったが、
 * 少数回答の議案が悪目立ちする事象が起きなかったため撤去した。
 * 件数によらず、公開条件（管理者公開×ユーザー同意）を満たす回答を返す。
 */
describe("getPublicBillRespondents の公開条件 統合テスト", () => {
  let testUser: TestUser;
  const createdBillIds: string[] = [];

  /** 公開（管理者公開×ユーザー公開）レポートを count 件持つ議案を作る。 */
  async function createBillWithPublicReports(count: number): Promise<string> {
    const bill = await createTestBill();
    createdBillIds.push(bill.id);

    const { data: config, error: configError } = await adminClient
      .from("interview_configs")
      .insert({
        bill_id: bill.id,
        status: "public",
        name: `k-anon-test ${Date.now()}`,
      })
      .select("id")
      .single();
    if (configError || !config) {
      throw new Error(`interview_configs 作成失敗: ${configError?.message}`);
    }

    const { data: sessions, error: sessionError } = await adminClient
      .from("interview_sessions")
      .insert(
        Array.from({ length: count }, () => ({
          interview_config_id: config.id,
          user_id: testUser.id,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }))
      )
      .select("id");
    if (sessionError || !sessions) {
      throw new Error(`interview_sessions 作成失敗: ${sessionError?.message}`);
    }

    const { error: reportError } = await adminClient
      .from("interview_report")
      .insert(
        sessions.map((session, i) => ({
          interview_session_id: session.id,
          is_public_by_user: true,
          is_public_by_admin: true,
          // moderation_status は moderation_score からの生成列のため指定しない。
          moderation_score: 5,
          role: "daily_life_affected" as const,
          role_title: `テスト回答者${i + 1}`,
          stance: "for" as const,
          summary: `テスト要約${i + 1}`,
        }))
      );
    if (reportError) {
      throw new Error(`interview_report 作成失敗: ${reportError.message}`);
    }

    return bill.id;
  }

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  afterAll(async () => {
    for (const billId of createdBillIds) {
      await cleanupTestBill(billId);
    }
    await cleanupTestUser(testUser.id);
  });

  // 撤去前は 20 件未満の議案で空配列になっていた箇所。
  it("公開レポートが少数でも回答者を返す", async () => {
    const billId = await createBillWithPublicReports(3);

    const rows = await findPublicBillRespondentRows(billId);
    expect(rows).toHaveLength(3);

    expect(await getPublicBillRespondents(billId)).toHaveLength(3);
  });

  it("公開レポートの属性を返す", async () => {
    const billId = await createBillWithPublicReports(2);

    const respondents = await getPublicBillRespondents(billId);

    expect(respondents).toHaveLength(2);
    expect(respondents[0].user_category).toBe("affected");
    expect(respondents[0].bill_sentiment).toBe("期待");
    expect(respondents[0].summary).toMatch(/^テスト要約/);
  });
});
