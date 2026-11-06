import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
} from "../utils";

/**
 * 公開の定義は「管理者公開 × ユーザー公開」。
 * 片方でも false なら数えない。一覧の回答数バッジが非公開のレポートを
 * 数えてしまうと、公開されていない意見の存在を数字で漏らすことになる。
 */
describe("count_public_reports_by_bill_ids", () => {
  let billPublic: { id: string };
  let billMixed: { id: string };
  let billEmpty: { id: string };
  let user: { id: string };

  // idx_interview_configs_bill_public により、公開設定は1議案1つまで。
  // レポートは同じ設定にセッションをぶら下げて増やす。
  async function createConfig(billId: string): Promise<string> {
    const { data, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status: "public", name: "設定" })
      .select()
      .single();
    if (error) throw new Error(`config 作成失敗: ${error.message}`);
    return data.id;
  }

  async function insertReport(
    configId: string,
    flags: { admin: boolean; user: boolean }
  ) {
    const { data: session, error: sessionError } = await adminClient
      .from("interview_sessions")
      .insert({
        interview_config_id: configId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (sessionError)
      throw new Error(`session 作成失敗: ${sessionError.message}`);

    const { error: reportError } = await adminClient
      .from("interview_report")
      .insert({
        interview_session_id: session.id,
        is_public_by_admin: flags.admin,
        is_public_by_user: flags.user,
      });
    if (reportError) throw new Error(`report 作成失敗: ${reportError.message}`);
  }

  beforeAll(async () => {
    user = await createTestUser();
    billPublic = await createTestBill();
    billMixed = await createTestBill();
    billEmpty = await createTestBill();

    const configPublic = await createConfig(billPublic.id);
    await insertReport(configPublic, { admin: true, user: true });
    await insertReport(configPublic, { admin: true, user: true });

    // 公開1件＋非公開2件（管理者非公開・ユーザー非公開を1件ずつ）
    const configMixed = await createConfig(billMixed.id);
    await insertReport(configMixed, { admin: true, user: true });
    await insertReport(configMixed, { admin: false, user: true });
    await insertReport(configMixed, { admin: true, user: false });
  });

  afterAll(async () => {
    // 1件の失敗で残りの片付けを落とさない。
    await Promise.allSettled([
      cleanupTestBill(billPublic.id),
      cleanupTestBill(billMixed.id),
      cleanupTestBill(billEmpty.id),
    ]);
    await cleanupTestUser(user.id);
  });

  it("議案ごとの公開レポート件数を1クエリで返す", async () => {
    const { data, error } = await adminClient.rpc(
      "count_public_reports_by_bill_ids",
      { p_bill_ids: [billPublic.id, billMixed.id] }
    );

    expect(error).toBeNull();
    const counts = new Map(data!.map((row) => [row.bill_id, row.report_count]));
    expect(counts.get(billPublic.id)).toBe(2);
    expect(counts.get(billMixed.id)).toBe(1);
  });

  it("公開レポートが0件の議案は結果に含まれない", async () => {
    const { data, error } = await adminClient.rpc(
      "count_public_reports_by_bill_ids",
      { p_bill_ids: [billEmpty.id] }
    );

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("指定していない議案は返さない", async () => {
    const { data } = await adminClient.rpc("count_public_reports_by_bill_ids", {
      p_bill_ids: [billPublic.id],
    });

    expect(data!.map((row) => row.bill_id)).toEqual([billPublic.id]);
  });

  it("空配列を渡しても落ちない", async () => {
    const { data, error } = await adminClient.rpc(
      "count_public_reports_by_bill_ids",
      { p_bill_ids: [] }
    );

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
