import { execSync } from "node:child_process";
import { describe, expect, it, afterEach } from "vitest";

const DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * GoTrue Admin API はトリガーの変更を上書きするため、
 * 直接 SQL INSERT でトリガーの動作を検証する。
 */
function runSQL(sql: string): string {
  return execSync(`psql "${DB_URL}" -t -A -q -c ${JSON.stringify(sql)}`, {
    encoding: "utf-8",
  }).trim();
}

describe("handle_google_workspace_admin_role トリガー", () => {
  const createdUserIds: string[] = [];

  function insertUser(email: string, provider: string): string {
    const id = runSQL(
      `INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at) VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '${email}', '', now(), '{"provider": "${provider}", "providers": ["${provider}"]}', '{}', 'authenticated', 'authenticated', now(), now()) RETURNING id`
    );
    createdUserIds.push(id);
    return id;
  }

  function getUserRoles(userId: string): string | null {
    const result = runSQL(
      `SELECT raw_app_meta_data->'roles' FROM auth.users WHERE id = '${userId}'`
    );
    return result || null;
  }

  afterEach(() => {
    for (const id of createdUserIds) {
      runSQL(`DELETE FROM auth.users WHERE id = '${id}'`);
    }
    createdUserIds.length = 0;
  });

  it("team-mir.ai + Google ログインユーザーに admin ロールが自動付与される", () => {
    const email = `test-google-${Date.now()}@team-mir.ai`;
    const userId = insertUser(email, "google");

    const roles = getUserRoles(userId);
    expect(JSON.parse(roles!)).toEqual(["admin"]);
  });

  it("team-mir.ai 以外のドメイン + Google ログインユーザーには admin ロールが付与されない", () => {
    const email = `test-google-${Date.now()}@gmail.com`;
    const userId = insertUser(email, "google");

    const roles = getUserRoles(userId);
    expect(roles).toBeNull();
  });

  it("team-mir.ai + email プロバイダーのユーザーには admin ロールが付与されない", () => {
    const email = `test-email-${Date.now()}@team-mir.ai`;
    const userId = insertUser(email, "email");

    const roles = getUserRoles(userId);
    expect(roles).toBeNull();
  });
});
