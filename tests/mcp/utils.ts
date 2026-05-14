import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ZodRawShape, z } from "zod";

type ToolHandler = (
  input: unknown,
  extra?: unknown
) => Promise<{
  content: Array<{ type: string; text: string }>;
}>;

type RegisteredTool = {
  name: string;
  inputSchema?: ZodRawShape;
  handler: ToolHandler;
};

export type TestMcpRegistry = {
  asMcpServer(): McpServer;
  callTool<T = unknown>(
    name: string,
    input?: Record<string, unknown>
  ): Promise<T>;
  hasTool(name: string): boolean;
  toolNames(): string[];
};

/**
 * MCPツールの統合テスト用レジストリ。
 * `register*Tools(registry.asMcpServer())` で各ツールを登録し、
 * `callTool(name, input)` でハンドラを直接呼び出して JSON を取り出す。
 */
export function createTestRegistry(): TestMcpRegistry {
  const tools = new Map<string, RegisteredTool>();

  const fakeServer = {
    registerTool(
      name: string,
      config: { inputSchema?: ZodRawShape },
      handler: ToolHandler
    ) {
      tools.set(name, {
        name,
        inputSchema: config.inputSchema,
        handler,
      });
      return { name };
    },
  } as unknown as McpServer;

  return {
    asMcpServer() {
      return fakeServer;
    },
    async callTool<T = unknown>(
      name: string,
      input: Record<string, unknown> = {}
    ) {
      const tool = tools.get(name);
      if (!tool) {
        throw new Error(`MCP tool ${name} is not registered`);
      }

      const parsed =
        tool.inputSchema !== undefined
          ? z.object(tool.inputSchema).parse(input)
          : input;

      const result = await tool.handler(parsed, {});
      if (!Array.isArray(result.content) || result.content.length !== 1) {
        throw new Error(
          `MCP tool ${name} must return exactly one content entry (got ${result.content?.length ?? 0})`
        );
      }
      const text = result.content[0]?.text;
      if (typeof text !== "string") {
        throw new Error(`MCP tool ${name} returned no text content`);
      }
      return JSON.parse(text) as T;
    },
    hasTool(name: string) {
      return tools.has(name);
    },
    toolNames() {
      return [...tools.keys()];
    },
  };
}
