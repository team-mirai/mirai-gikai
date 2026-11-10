import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  summarizeToolArgs,
  summarizeToolResult,
  type ToolResultForLog,
} from "../../shared/utils/tool-call-log";

type AnyToolHandler = (...handlerArgs: unknown[]) => Promise<ToolResultForLog>;

/**
 * 登録するすべてのツールについて、呼び出しごとにツール名・引数・所要時間・返り値の概要をログに出す。
 * MCP の呼び出しは HTTP のログではどのツールが呼ばれたか分からないため、ここで記録する。
 * 渡した server の registerTool を書き換え、同じ server を返す
 */
export function withToolCallLogging(server: McpServer): McpServer {
  // registerTool は入力スキーマの型ごとにジェネリックなので、ラップする間は引数を緩い型で扱う
  const registerTool = server.registerTool.bind(server) as (
    name: string,
    config: { inputSchema?: unknown },
    handler: AnyToolHandler
  ) => ReturnType<McpServer["registerTool"]>;

  server.registerTool = ((name, config, handler) =>
    registerTool(name, config, async (...handlerArgs) => {
      // inputSchema の無いツールは、第1引数が引数ではなく extra になる
      const args = summarizeToolArgs(
        config.inputSchema ? handlerArgs[0] : undefined
      );
      const startedAt = Date.now();
      const prefix = () =>
        `[AdminMcp] tool=${name} durationMs=${Date.now() - startedAt} args=${args}`;
      try {
        const result = await handler(...handlerArgs);
        console.info(`${prefix()} result=${summarizeToolResult(result)}`);
        return result;
      } catch (error) {
        console.error(`${prefix()} threw:`, error);
        throw error;
      }
    })) as typeof registerTool as McpServer["registerTool"];

  return server;
}
