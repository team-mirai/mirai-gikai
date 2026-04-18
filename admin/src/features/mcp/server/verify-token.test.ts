import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyMcpToken } from "./verify-token";

describe("verifyMcpToken", () => {
  const originalToken = process.env.ADMIN_MCP_TOKEN;

  beforeEach(() => {
    process.env.ADMIN_MCP_TOKEN = "test-token";
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.ADMIN_MCP_TOKEN;
    } else {
      process.env.ADMIN_MCP_TOKEN = originalToken;
    }
  });

  it("正しいBearerトークンでAuthInfoを返す", async () => {
    const req = new Request("http://localhost/api/mcp");
    const result = await verifyMcpToken(req, "test-token");

    expect(result).toEqual({
      token: "test-token",
      clientId: "mirai-gikai-content-agent",
      scopes: ["bills:write", "tags:write"],
    });
  });

  it("誤ったトークンだとundefinedを返す", async () => {
    const req = new Request("http://localhost/api/mcp");
    expect(await verifyMcpToken(req, "wrong")).toBeUndefined();
  });

  it("トークン長が違う場合もundefinedを返す", async () => {
    const req = new Request("http://localhost/api/mcp");
    expect(await verifyMcpToken(req, "test-token-longer")).toBeUndefined();
  });

  it("トークン未指定だとundefinedを返す", async () => {
    const req = new Request("http://localhost/api/mcp");
    expect(await verifyMcpToken(req)).toBeUndefined();
  });

  it("環境変数が未設定ならundefinedを返す", async () => {
    delete process.env.ADMIN_MCP_TOKEN;
    const req = new Request("http://localhost/api/mcp");
    expect(await verifyMcpToken(req, "any")).toBeUndefined();
  });

  it("環境変数が空文字ならundefinedを返す", async () => {
    process.env.ADMIN_MCP_TOKEN = "";
    const req = new Request("http://localhost/api/mcp");
    expect(await verifyMcpToken(req, "")).toBeUndefined();
  });
});
