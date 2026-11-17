import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { withToolCallLogging } from "../../admin/src/features/mcp/server/utils/with-tool-call-logging";
import { createTestRegistry } from "./utils";

describe("withToolCallLogging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setup() {
    const registry = createTestRegistry();
    const server = withToolCallLogging(registry.asMcpServer());
    server.registerTool(
      "echo",
      { inputSchema: { message: z.string() } },
      async ({ message }) => {
        if (message === "throw") throw new Error("boom");
        return {
          isError: message === "error",
          content: [{ type: "text" as const, text: message }],
        };
      }
    );
    return registry;
  }

  it("呼び出しごとにツール名・引数・返り値の概要をログに出し、返り値はそのまま返す", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const registry = setup();

    const result = await registry.callToolResult("echo", { message: "hi" });

    expect(result).toEqual({
      isError: false,
      content: [{ type: "text", text: "hi" }],
    });
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[0]).toMatch(
      /^\[AdminMcp\] tool=echo durationMs=\d+ args=\{"message":"hi"\} result=ok content=\[text\(2 chars\)\]$/
    );
  });

  it("inputSchema の無いツールは引数を - として出す", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const registry = createTestRegistry();
    withToolCallLogging(registry.asMcpServer()).registerTool(
      "ping",
      {},
      async () => ({ content: [{ type: "text" as const, text: "pong" }] })
    );

    await registry.callToolResult("ping");

    expect(info.mock.calls[0]?.[0]).toMatch(
      /^\[AdminMcp\] tool=ping durationMs=\d+ args=- result=ok/
    );
  });

  it("isError の結果は理由のテキストもログに出す", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const registry = setup();

    await registry.callToolResult("echo", { message: "error" });

    expect(info.mock.calls[0]?.[0]).toContain(
      "result=error content=[text(5 chars)] message=error"
    );
  });

  it("例外はエラーログに出してから投げ直す", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const registry = setup();

    await expect(
      registry.callToolResult("echo", { message: "throw" })
    ).rejects.toThrow("boom");
    expect(error.mock.calls[0]?.[0]).toMatch(
      /^\[AdminMcp\] tool=echo durationMs=\d+ args=\{"message":"throw"\} threw:$/
    );
  });
});
