import "server-only";

import {
  createMcpHandler,
  experimental_withMcpAuth as withMcpAuth,
} from "mcp-handler";
import { registerBillsTools } from "./tools/register-bills-tools";
import { registerDietSessionsTools } from "./tools/register-diet-sessions-tools";
import { registerMiraiStanceTools } from "./tools/register-mirai-stance-tools";
import { registerPreviewTools } from "./tools/register-preview-tools";
import { registerTagsTools } from "./tools/register-tags-tools";
import { registerTopicAnalysisTools } from "./tools/register-topic-analysis-tools";
import { verifyMcpToken } from "./verify-token";

export function createAdminMcpHandler() {
  const baseHandler = createMcpHandler(
    (server) => {
      registerBillsTools(server);
      registerDietSessionsTools(server);
      registerMiraiStanceTools(server);
      registerPreviewTools(server);
      registerTagsTools(server);
      registerTopicAnalysisTools(server);
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
