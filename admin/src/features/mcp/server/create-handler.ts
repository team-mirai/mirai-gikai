import "server-only";

import {
  createMcpHandler,
  experimental_withMcpAuth as withMcpAuth,
} from "mcp-handler";
import { registerBillsTools } from "./tools/register-bills-tools";
import { registerTagsTools } from "./tools/register-tags-tools";
import { verifyMcpToken } from "./verify-token";

export function createAdminMcpHandler() {
  const baseHandler = createMcpHandler(
    (server) => {
      registerBillsTools(server);
      registerTagsTools(server);
    },
    {
      serverInfo: {
        name: "mirai-gikai-admin-mcp",
        version: "0.1.0",
      },
    },
    {
      basePath: "/api",
      verboseLogs: process.env.NODE_ENV !== "production",
    }
  );

  return withMcpAuth(baseHandler, verifyMcpToken, {
    required: true,
  });
}
