import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  adminClient,
  createTestBill,
  createTestUser,
  cleanupTestBill,
  cleanupTestUser,
} from "../utils";

/**
 * 指定 config 配下にセッション＋レポートを作成し、レポートIDを返すヘルパー
 */
async function createSessionWithReport(
  configId: string,
  userId: string,
  flags: { is_public_by_admin: boolean; is_public_by_user: boolean }
): Promise<string> {
  const { data: session, error: sessionError } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (sessionError)
    throw new Error(`session 作成失敗: ${sessionError.message}`);

  const { data: report, error: reportError } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: session.id,
      is_public_by_admin: flags.is_public_by_admin,
      is_public_by_user: flags.is_public_by_user,
    })
    .select()
    .single();
  if (reportError) throw new Error(`report 作成失敗: ${reportError.message}`);

  return report.id;
}

async function getReportAdminFlag(reportId: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from("interview_report")
    .select("is_public_by_admin")
    .eq("id", reportId)
    .single();
  if (error) throw new Error(`report 取得失敗: ${error.message}`);
  return data.is_public_by_admin;
}

describe("unpublish_reports_by_config_id", () => {
  let bill: { id: string };
  let user: { id: string };
  let targetConfigId: string;
  let otherConfigId: string;

  // target config 配下のレポート
  let publicReportId: string;
  let userPrivateReportId: string; // is_public_by_admin=true, is_public_by_user=false
  let alreadyPrivateReportId: string; // is_public_by_admin=false
  // 別 config の公開レポート（影響を受けないことの確認用）
  let otherPublicReportId: string;

  beforeAll(async () => {
    user = await createTestUser();
    bill = await createTestBill();

    const { data: target, error: targetError } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: bill.id, status: "public", name: "削除対象設定" })
      .select()
      .single();
    if (targetError) throw new Error(`config 作成失敗: ${targetError.message}`);
    targetConfigId = target.id;

    const { data: other, error: otherError } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: bill.id, status: "closed", name: "別設定" })
      .select()
      .single();
    if (otherError) throw new Error(`config 作成失敗: ${otherError.message}`);
    otherConfigId = other.id;

    publicReportId = await createSessionWithReport(targetConfigId, user.id, {
      is_public_by_admin: true,
      is_public_by_user: true,
    });
    userPrivateReportId = await createSessionWithReport(
      targetConfigId,
      user.id,
      {
        is_public_by_admin: true,
        is_public_by_user: false,
      }
    );
    alreadyPrivateReportId = await createSessionWithReport(
      targetConfigId,
      user.id,
      { is_public_by_admin: false, is_public_by_user: true }
    );
    otherPublicReportId = await createSessionWithReport(
      otherConfigId,
      user.id,
      {
        is_public_by_admin: true,
        is_public_by_user: true,
      }
    );
  });

  afterAll(async () => {
    await cleanupTestBill(bill.id);
    await cleanupTestUser(user.id);
  });

  it("対象config配下の公開レポートを非公開(is_public_by_admin=false)にする", async () => {
    const { error } = await adminClient.rpc("unpublish_reports_by_config_id", {
      p_config_id: targetConfigId,
    });

    expect(error).toBeNull();
    expect(await getReportAdminFlag(publicReportId)).toBe(false);
    // is_public_by_user に関わらず admin フラグを下げる
    expect(await getReportAdminFlag(userPrivateReportId)).toBe(false);
    // もともと非公開のものは false のまま
    expect(await getReportAdminFlag(alreadyPrivateReportId)).toBe(false);
  });

  it("別configのレポートには影響しない", async () => {
    await adminClient.rpc("unpublish_reports_by_config_id", {
      p_config_id: targetConfigId,
    });

    expect(await getReportAdminFlag(otherPublicReportId)).toBe(true);
  });

  it("存在しないconfig IDを渡してもエラーにならない（no-op）", async () => {
    const { error } = await adminClient.rpc("unpublish_reports_by_config_id", {
      p_config_id: "00000000-0000-0000-0000-000000000000",
    });

    expect(error).toBeNull();
  });
});
