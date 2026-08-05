import {
  findPublicBillRespondentRows,
  getPublicBillRespondents,
} from "@mirai-gikai/topic-analysis-core/public-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "../../packages/shared/src/report-publication/auto-publish";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "./utils";

/**
 * 回答一覧（getPublicBillRespondents）の k-匿名性ゲート統合テスト。
 * 公開レポートが MIN_PUBLIC_REPORTS_FOR_DISPLAY 件未満の議案では、
 * 回答者個人の属性（role_title・stance・summary）を返さないことを確認する。
 */
describe("getPublicBillRespondents の k-匿名性ゲート 統合テスト", () => {
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

  it("公開レポートがしきい値未満なら回答者を返さない", async () => {
    const billId = await createBillWithPublicReports(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1
    );

    // 公開条件自体は満たしている（＝ゲートだけで隠されている）ことを確認する。
    const rows = await findPublicBillRespondentRows(billId);
    expect(rows).toHaveLength(MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1);

    expect(await getPublicBillRespondents(billId)).toEqual([]);
  });

  it("公開レポートがしきい値以上なら回答者を返す", async () => {
    const billId = await createBillWithPublicReports(
      MIN_PUBLIC_REPORTS_FOR_DISPLAY
    );

    const respondents = await getPublicBillRespondents(billId);

    expect(respondents).toHaveLength(MIN_PUBLIC_REPORTS_FOR_DISPLAY);
    expect(respondents[0].user_category).toBe("affected");
    expect(respondents[0].bill_sentiment).toBe("期待");
    expect(respondents[0].summary).toMatch(/^テスト要約/);
  });
});
