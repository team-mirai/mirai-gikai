import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ZodRawShape, z } from "zod";
import { unwrapUntrustedData } from "../../admin/src/features/mcp/shared/utils/untrusted-data-block";

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
  /** ツール結果のテキストを加工せず返す（untrusted-user-data ブロックの検証用）。 */
  callToolRaw(name: string, input?: Record<string, unknown>): Promise<string>;
  hasTool(name: string): boolean;
  toolNames(): string[];
};

/**
 * MCPツールの統合テスト用レジストリ。
 * `register*Tools(registry.asMcpServer())` で各ツールを登録し、
 * `callTool(name, input)` でハンドラを直接呼び出して JSON を取り出す。
 * 自由記述を含むツールは untrusted-user-data ブロックで囲んで返るため、
 * MCP クライアントと同様にブロックを外してから JSON として解釈する。
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

  async function callToolText(
    name: string,
    input: Record<string, unknown>
  ): Promise<string> {
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
    return text;
  }

  return {
    asMcpServer() {
      return fakeServer;
    },
    async callTool<T = unknown>(
      name: string,
      input: Record<string, unknown> = {}
    ) {
      const text = await callToolText(name, input);
      return JSON.parse(unwrapUntrustedData(text) ?? text) as T;
    },
    async callToolRaw(name: string, input: Record<string, unknown> = {}) {
      return await callToolText(name, input);
    },
    hasTool(name: string) {
      return tools.has(name);
    },
    toolNames() {
      return [...tools.keys()];
    },
  };
}
