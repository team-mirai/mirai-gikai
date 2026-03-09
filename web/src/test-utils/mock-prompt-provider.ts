import type { PromptProvider } from "@/lib/prompt";
import type { CompiledPrompt, PromptVariables } from "@/lib/prompt";

/**
 * テスト用の PromptProvider モック実装。
 * Langfuse への通信を行わず、固定のプロンプト文字列を返す。
 */
export class MockPromptProvider implements PromptProvider {
  private readonly content: string;

  constructor(content = "テスト用システムプロンプト") {
    this.content = content;
  }

  async getPrompt(
    _name: string,
    _variables?: PromptVariables
  ): Promise<CompiledPrompt> {
    return {
      content: this.content,
      metadata: "{}",
    };
  }
}

/**
 * MockPromptProvider のファクトリ関数。
 * @param content - getPrompt が返すプロンプト文字列（省略時はデフォルト値）
 */
export function createMockPromptProvider(content?: string): MockPromptProvider {
  return new MockPromptProvider(content);
}
