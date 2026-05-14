import "server-only";

import {
  buildTargetedModeSystemPrompt,
  calculateTargetedModeNextQuestionId,
} from "@/features/interview-session/shared/utils/interview-logic/targeted-mode";
import type {
  InterviewModeLogic,
  InterviewPromptParams,
  NextQuestionParams,
} from "./types";

/**
 * Targeted Mode（対象者指定モード）の全ロジック
 *
 * Loop Mode と同様に1問ずつ深掘りするが、各質問に任意で対象者条件を持たせられる。
 * LLM が会話文脈から該当性を判定し、非該当ならスキップする。
 *
 * 実ロジックは shared/utils/interview-logic/targeted-mode.ts に純粋関数として切り出し済み
 */
export const targetedModeLogic: InterviewModeLogic = {
  buildSystemPrompt(params: InterviewPromptParams): string {
    return buildTargetedModeSystemPrompt(params);
  },

  calculateNextQuestionId(params: NextQuestionParams): string | undefined {
    return calculateTargetedModeNextQuestionId(params);
  },
};
