import type { PromptProvider } from "../interface/prompt-provider";
import type { CompiledPrompt, PromptVariables } from "../interface/types";
import { compileTemplate } from "../shared/compile-template";
import { TOP_CHAT_SYSTEM_TEMPLATE } from "./templates/top-chat-system";

/** ソースコード管理プロンプトのテンプレートマップ */
const TEMPLATES: Record<string, string> = {
  "top-chat-system": TOP_CHAT_SYSTEM_TEMPLATE,
};

/**
 * ソースコードに定義されたプロンプトテンプレートを返すプロバイダー
 */
export class SourceCodePromptProvider implements PromptProvider {
  async getPrompt(
    name: string,
    variables?: PromptVariables
  ): Promise<CompiledPrompt> {
    const template = TEMPLATES[name];
    if (!template) {
      throw new Error(
        `Source code prompt template not found: "${name}". Available: ${Object.keys(TEMPLATES).join(", ")}`
      );
    }

    const content = compileTemplate(template, variables);

    const unresolvedPlaceholders = content.match(/\{\{\w+\}\}/g);
    if (unresolvedPlaceholders) {
      throw new Error(
        `Missing prompt variables for "${name}": ${unresolvedPlaceholders.join(", ")}`
      );
    }

    const metadata = JSON.stringify({ source: "source-code", name });

    return { content, metadata };
  }
}
