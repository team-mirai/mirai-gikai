import type { Langfuse } from "langfuse";
import type { PromptProvider } from "../interface/prompt-provider";
import type { CompiledPrompt, PromptVariables } from "../interface/types";
import { compilePrompt } from "../shared/compile-prompt";
import { env } from "@/lib/env";

const FALLBACK_LABEL = "production";

function isPromptNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("prompt not found")
  );
}

export class LangfusePromptProvider implements PromptProvider {
  constructor(private client: Langfuse) {}

  async getPrompt(
    name: string,
    variables?: PromptVariables
  ): Promise<CompiledPrompt> {
    const primaryLabel = env.langfuse.promptLabel;

    try {
      const fetchedPrompt = await this.client.getPrompt(name, undefined, {
        label: primaryLabel,
      });

      return compilePrompt(fetchedPrompt, variables);
    } catch (error) {
      if (primaryLabel !== FALLBACK_LABEL && isPromptNotFoundError(error)) {
        console.warn(
          `[Langfuse] Prompt "${name}" not found with label "${primaryLabel}", falling back to "${FALLBACK_LABEL}"`
        );
        const fallbackPrompt = await this.client.getPrompt(name, undefined, {
          label: FALLBACK_LABEL,
        });
        return compilePrompt(fallbackPrompt, variables);
      }

      throw new Error(
        `Failed to fetch prompt "${name}" from Langfuse: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
