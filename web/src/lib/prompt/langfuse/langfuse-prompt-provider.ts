import type { Langfuse } from "langfuse";
import type { PromptProvider } from "../interface/prompt-provider";
import type { CompiledPrompt, PromptVariables } from "../interface/types";
import { compilePrompt } from "../shared/compile-prompt";
import { env } from "@/lib/env";

export class LangfusePromptProvider implements PromptProvider {
  constructor(private client: Langfuse) {}

  async getPrompt(
    name: string,
    variables?: PromptVariables
  ): Promise<CompiledPrompt> {
    try {
      const fetchedPrompt = await this.client.getPrompt(name, undefined, {
        label: env.langfuse.promptLabel,
      });

      return compilePrompt(fetchedPrompt, variables);
    } catch (error) {
      throw new Error(
        `Failed to fetch prompt "${name}" from Langfuse: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
