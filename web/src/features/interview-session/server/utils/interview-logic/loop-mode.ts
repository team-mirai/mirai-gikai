import "server-only";

import {
  buildLoopModeSystemPrompt,
  calculateLoopModeNextQuestionId,
} from "@/features/interview-session/shared/utils/interview-logic/loop-mode";
import type {
  InterviewModeLogic,
  InterviewPromptParams,
  NextQuestionParams,
} from "./types";

/**
 * Loop Mode（都度深掘りモード）の全ロジック
 *
 * このファイルを見れば、Loop Modeに関する以下を把握できる：
 * - システムプロンプトの構築方法
 * - ステージ遷移判定の指針
 * - モード固有の判定条件
 *
 * ## モードの特徴
 * - 1つのテーマについて多角的に掘り下げる
 * - ユーザーの回答に共感し、追加の質問を重ねる
 * - follow_up_guide を質問リストに含める
 *
 * 実ロジックは shared/utils/interview-logic/loop-mode.ts に純粋関数として切り出し済み
 */
export const loopModeLogic: InterviewModeLogic = {
  buildSystemPrompt(params: InterviewPromptParams): string {
    return buildLoopModeSystemPrompt(params);
  },

  calculateNextQuestionId(params: NextQuestionParams): string | undefined {
    return calculateLoopModeNextQuestionId(params);
  },
};
