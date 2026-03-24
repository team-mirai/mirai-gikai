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
  const sourceCodeNames = new Set([
    "top-chat-system",
    "bill-chat-system-normal",
  ]);

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

  it("bill-chat-system-normal もsourceCodeProviderにルーティングされる", async () => {
    const result = await composite.getPrompt("bill-chat-system-normal", {
      billName: "test",
      billTitle: "test",
      billSummary: "test",
      billContent: "test",
    });
    expect(result.content).toBe("source-code:bill-chat-system-normal");
  });

  it("bill-chat-system-hard はfallbackにルーティングされる", async () => {
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
      new Set(["top-chat-system", "bill-chat-system-normal"])
    );

    await lazyComposite.getPrompt("top-chat-system", {
      billSummary: "test",
    });

    expect(factoryCalled).toBe(false);
  });
});
