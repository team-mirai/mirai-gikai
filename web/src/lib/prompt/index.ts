import "server-only";
import { CompositePromptProvider } from "./composite/composite-prompt-provider";
import type { PromptProvider } from "./interface/prompt-provider";
import { getLangfuseClient } from "./langfuse/client";
import { LangfusePromptProvider } from "./langfuse/langfuse-prompt-provider";
import {
  SOURCE_CODE_PROMPT_NAMES,
  SourceCodePromptProvider,
} from "./source-code/source-code-prompt-provider";

/**
 * プロンプトプロバイダーの作成処理
 *
 * 全チャットプロンプト（top-chat-system, bill-chat-system-normal, bill-chat-system-hard）は
 * SourceCodePromptProviderから取得する。
 * それ以外のプロンプトはLangfusePromptProviderにフォールバックする。
 */
export function createPromptProvider(): PromptProvider {
  const sourceCodeProvider = new SourceCodePromptProvider();

  return new CompositePromptProvider(
    sourceCodeProvider,
    () => {
      const client = getLangfuseClient();
      return new LangfusePromptProvider(client);
    },
    SOURCE_CODE_PROMPT_NAMES
  );
}

export type { PromptProvider } from "./interface/prompt-provider";
export type { CompiledPrompt, PromptVariables } from "./interface/types";
