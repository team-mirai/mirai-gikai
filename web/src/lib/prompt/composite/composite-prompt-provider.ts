import type { PromptProvider } from "../interface/prompt-provider";
import type { CompiledPrompt, PromptVariables } from "../interface/types";

/**
 * プロンプト名に基づいて適切なプロバイダーにルーティングする複合プロバイダー
 *
 * sourceCodePromptNames に含まれるプロンプトはソースコードプロバイダーから、
 * それ以外はフォールバックプロバイダーから取得する。
 * フォールバックプロバイダーはファクトリ関数経由で遅延初期化される。
 */
export class CompositePromptProvider implements PromptProvider {
  private fallbackProvider: PromptProvider | null = null;

  constructor(
    private sourceCodeProvider: PromptProvider,
    private createFallbackProvider: () => PromptProvider,
    private sourceCodePromptNames: ReadonlySet<string>
  ) {}

  async getPrompt(
    name: string,
    variables?: PromptVariables
  ): Promise<CompiledPrompt> {
    if (this.sourceCodePromptNames.has(name)) {
      return this.sourceCodeProvider.getPrompt(name, variables);
    }

    if (!this.fallbackProvider) {
      this.fallbackProvider = this.createFallbackProvider();
    }
    return this.fallbackProvider.getPrompt(name, variables);
  }
}
