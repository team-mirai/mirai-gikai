import { describe, expect, it } from "vitest";
import type { CompiledPrompt, PromptVariables } from "../interface/types";
import { CompositePromptProvider } from "./composite-prompt-provider";

function createFakeProvider(label: string): {
  getPrompt: (
    name: string,
    variables?: PromptVariables
  ) => Promise<CompiledPrompt>;
} {
  return {
    getPrompt: async (name: string) => ({
      content: `${label}:${name}`,
      metadata: JSON.stringify({ source: label }),
    }),
  };
}

describe("CompositePromptProvider", () => {
  const sourceCodeProvider = createFakeProvider("source-code");
  const sourceCodeNames = new Set(["top-chat-system"]);

  const composite = new CompositePromptProvider(
    sourceCodeProvider,
    () => createFakeProvider("langfuse"),
    sourceCodeNames
  );

  it("ソースコード管理のプロンプト名はsourceCodeProviderにルーティングされる", async () => {
    const result = await composite.getPrompt("top-chat-system", {
      billSummary: "test",
    });
    expect(result.content).toBe("source-code:top-chat-system");
  });

  it("それ以外のプロンプト名はfallbackProviderにルーティングされる", async () => {
    const result = await composite.getPrompt("bill-chat-system-normal");
    expect(result.content).toBe("langfuse:bill-chat-system-normal");
  });

  it("bill-chat-system-hard もfallbackにルーティングされる", async () => {
    const result = await composite.getPrompt("bill-chat-system-hard");
    expect(result.content).toBe("langfuse:bill-chat-system-hard");
  });

  it("ソースコードプロンプトのみ使用時はfallbackファクトリが呼ばれない", async () => {
    let factoryCalled = false;
    const lazyComposite = new CompositePromptProvider(
      createFakeProvider("source-code"),
      () => {
        factoryCalled = true;
        return createFakeProvider("langfuse");
      },
      new Set(["top-chat-system"])
    );

    await lazyComposite.getPrompt("top-chat-system", {
      billSummary: "test",
    });

    expect(factoryCalled).toBe(false);
  });
});
