import { describe, expect, it, afterEach } from "vitest";
import { adminClient, cleanupTestUser } from "../utils";

describe("apply_admin_role_if_eligible 関数", () => {
  const createdUserIds: string[] = [];

  async function createUserWithProvider(
    email: string,
    provider: string
  ): Promise<string> {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { provider, providers: [provider] },
    });
    if (error) throw new Error(`ユーザー作成失敗: ${error.message}`);
    createdUserIds.push(data.user.id);
    return data.user.id;
  }

  async function getUserRoles(userId: string): Promise<string[] | undefined> {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) throw new Error(`ユーザー取得失敗: ${error.message}`);
    return data.user.app_metadata?.roles;
  }

  afterEach(async () => {
    for (const id of createdUserIds) {
      await cleanupTestUser(id);
    }
    createdUserIds.length = 0;
  });

  it("team-mir.ai + Google ログインユーザーに admin ロールが付与される", async () => {
    const email = `test-google-${Date.now()}@team-mir.ai`;
    const userId = await createUserWithProvider(email, "google");

    const { data: applied } = await adminClient.rpc(
      "apply_admin_role_if_eligible",
      { target_user_id: userId }
    );
    expect(applied).toBe(true);

    const roles = await getUserRoles(userId);
    expect(roles).toEqual(["admin"]);
  });

  it("team-mir.ai 以外のドメイン + Google ログインユーザーには付与されない", async () => {
    const email = `test-google-${Date.now()}@gmail.com`;
    const userId = await createUserWithProvider(email, "google");

    const { data: applied } = await adminClient.rpc(
      "apply_admin_role_if_eligible",
      { target_user_id: userId }
    );
    expect(applied).toBe(false);

    const roles = await getUserRoles(userId);
    expect(roles).toBeUndefined();
  });

  it("team-mir.ai + email プロバイダーのユーザーには付与されない", async () => {
    const email = `test-email-${Date.now()}@team-mir.ai`;
    const userId = await createUserWithProvider(email, "email");

    const { data: applied } = await adminClient.rpc(
      "apply_admin_role_if_eligible",
      { target_user_id: userId }
    );
    expect(applied).toBe(false);

    const roles = await getUserRoles(userId);
    expect(roles).toBeUndefined();
  });
});
