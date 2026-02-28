import type { Langfuse } from "langfuse";
import type { PromptProvider } from "../interface/prompt-provider";
import type { CompiledPrompt, PromptVariables } from "../interface/types";
import { compilePrompt } from "../shared/compile-prompt";
import { env } from "@/lib/env";

const FALLBACK_LABEL = "production";

export class LangfusePromptProvider implements PromptProvider {
  constructor(private client: Langfuse) {}

  async getPrompt(
    name: string,
    variables?: PromptVariables
  ): Promise<CompiledPrompt> {
    const fetchedPrompt = await this.fetchPromptWithFallback(name);
    return compilePrompt(fetchedPrompt, variables);
  }

  private async fetchPromptWithFallback(name: string) {
    const primaryLabel = env.langfuse.promptLabel;

    try {
      return await this.client.getPrompt(name, undefined, {
        label: primaryLabel,
      });
    } catch (error) {
      if (primaryLabel === FALLBACK_LABEL) {
        throw error;
      }

      console.warn(
        `[Langfuse] Prompt "${name}" not found with label "${primaryLabel}", falling back to "${FALLBACK_LABEL}": ${error instanceof Error ? error.message : String(error)}`
      );
      return await this.client.getPrompt(name, undefined, {
        label: FALLBACK_LABEL,
      });
    }
  }
}
