import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

const MCP_CLIENT_ID = "mirai-gikai-content-agent";

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  const expected = process.env.ADMIN_MCP_TOKEN;

  if (!expected || expected.length === 0) {
    console.error("ADMIN_MCP_TOKEN is not configured");
    return undefined;
  }

  if (!bearerToken || !constantTimeEqual(bearerToken, expected)) {
    return undefined;
  }

  return {
    token: bearerToken,
    clientId: MCP_CLIENT_ID,
    scopes: ["bills:write", "tags:write"],
  };
}
