import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createTestAdminUser,
  createTestUser,
  cleanupTestUser,
  getAnonClient,
  getAuthenticatedClient,
  type TestUser,
} from "../utils";

describe("is_admin() 関数", () => {
  let adminUser: TestUser;
  let normalUser: TestUser;

  beforeEach(async () => {
    adminUser = await createTestAdminUser();
    normalUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestUser(adminUser.id);
    await cleanupTestUser(normalUser.id);
  });

  it("admin ユーザーで認証すると true を返す", async () => {
    const client = await getAuthenticatedClient(
      adminUser.email,
      adminUser.password
    );
    const { data, error } = await client.rpc("is_admin");
    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("一般ユーザーで認証すると false を返す", async () => {
    const client = await getAuthenticatedClient(
      normalUser.email,
      normalUser.password
    );
    const { data, error } = await client.rpc("is_admin");
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("anon クライアントでは false を返す", async () => {
    const client = getAnonClient();
    const { data, error } = await client.rpc("is_admin");
    expect(error).toBeNull();
    expect(data).toBe(false);
  });
});
