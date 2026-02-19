import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  getAnonClient,
  createTestAdminUser,
  createTestUser,
  cleanupTestUser,
  type TestUser,
} from "../utils";

describe("get_admin_users() 関数", () => {
  let testUsers: TestUser[] = [];

  beforeEach(async () => {
    testUsers = [];
  });

  afterEach(async () => {
    for (const user of testUsers) {
      await cleanupTestUser(user.id);
    }
  });

  it("admin ユーザーのみを返す", async () => {
    const admin1 = await createTestAdminUser(
      `admin1-${Date.now()}@example.com`
    );
    const admin2 = await createTestAdminUser(
      `admin2-${Date.now()}@example.com`
    );
    const normalUser = await createTestUser(`normal-${Date.now()}@example.com`);
    testUsers.push(admin1, admin2, normalUser);

    const { data, error } = await adminClient.rpc("get_admin_users");

    expect(error).toBeNull();
    expect(data).toBeTruthy();

    const ids = data?.map((u: { id: string }) => u.id);
    expect(ids).toContain(admin1.id);
    expect(ids).toContain(admin2.id);
    expect(ids).not.toContain(normalUser.id);
  });

  it("返されるフィールドが正しい", async () => {
    const admin = await createTestAdminUser();
    testUsers.push(admin);

    const { data, error } = await adminClient.rpc("get_admin_users");
    expect(error).toBeNull();

    const found = data?.find((u: { id: string }) => u.id === admin.id);
    expect(found).toBeTruthy();
    expect(found?.email).toBe(admin.email);
    expect(found?.created_at).toBeTruthy();
    // last_sign_in_at は未ログインのため null の可能性
  });

  it("service_role クライアントで実行できる", async () => {
    const { error } = await adminClient.rpc("get_admin_users");
    expect(error).toBeNull();
  });

  it("anon クライアントではパーミッションエラーになる", async () => {
    const client = getAnonClient();
    const { error } = await client.rpc("get_admin_users");
    expect(error).not.toBeNull();
  });
});
