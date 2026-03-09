import type { CompiledPrompt, PromptVariables } from "../interface/types";

/**
 * Langfuseから取得したプロンプトをコンパイルする純粋関数
 */
export function compilePrompt(
  fetchedPrompt: {
    compile: (variables: Record<string, string>) => string;
    toJSON: () => string;
  },
  variables?: PromptVariables
): CompiledPrompt {
  const content = fetchedPrompt.compile(variables || {});
  const metadata = fetchedPrompt.toJSON();
  return { content, metadata };
}
