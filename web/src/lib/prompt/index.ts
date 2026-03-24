import "server-only";
import { CompositePromptProvider } from "./composite/composite-prompt-provider";
import type { PromptProvider } from "./interface/prompt-provider";
import { getLangfuseClient } from "./langfuse/client";
import { LangfusePromptProvider } from "./langfuse/langfuse-prompt-provider";
import { SourceCodePromptProvider } from "./source-code/source-code-prompt-provider";

/** ソースコードで管理するプロンプト名の一覧 */
const SOURCE_CODE_PROMPT_NAMES = new Set(["top-chat-system"]);

/**
 * プロンプトプロバイダーの作成処理
 *
 * ソースコード管理のプロンプト（top-chat-system）はSourceCodePromptProviderから、
 * それ以外（bill-chat-system-*）はLangfusePromptProviderから取得する。
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
