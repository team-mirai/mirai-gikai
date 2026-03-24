import type { PromptProvider } from "../interface/prompt-provider";
import type { CompiledPrompt, PromptVariables } from "../interface/types";
import { buildTopChatSystemPrompt } from "./templates/top-chat-system";

/** プロンプト名からビルド関数へのマップ */
const PROMPT_BUILDERS: Record<string, (variables: PromptVariables) => string> =
  {
    "top-chat-system": (v) => {
      if (!v.billSummary) {
        throw new Error(
          'Missing required variable "billSummary" for prompt "top-chat-system"'
        );
      }
      return buildTopChatSystemPrompt(v.billSummary);
    },
  };

/** ソースコードで管理するプロンプト名の一覧 */
export const SOURCE_CODE_PROMPT_NAMES: ReadonlySet<string> = new Set(
  Object.keys(PROMPT_BUILDERS)
);

/**
 * ソースコードに定義されたプロンプトテンプレートを返すプロバイダー
 */
export class SourceCodePromptProvider implements PromptProvider {
  async getPrompt(
    name: string,
    variables?: PromptVariables
  ): Promise<CompiledPrompt> {
    const builder = PROMPT_BUILDERS[name];
    if (!builder) {
      throw new Error(
        `Source code prompt not found: "${name}". Available: ${Object.keys(PROMPT_BUILDERS).join(", ")}`
      );
    }

    const content = builder(variables ?? {});
    const metadata = JSON.stringify({ source: "source-code", name });

    return { content, metadata };
  }
}
