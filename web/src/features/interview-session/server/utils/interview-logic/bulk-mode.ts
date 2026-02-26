import "server-only";

import {
  buildBulkModeSystemPrompt,
  calculateBulkModeNextQuestionId,
} from "@/features/interview-session/shared/utils/interview-logic/bulk-mode";
import type {
  InterviewModeLogic,
  InterviewPromptParams,
  NextQuestionParams,
} from "./types";

/**
 * Bulk Mode（一括回答優先モード）の全ロジック
 *
 * このファイルを見れば、Bulk Modeに関する以下を把握できる：
 * - システムプロンプトの構築方法
 * - ステージ遷移判定の指針
 * - モード固有の判定条件
 *
 * ## モードの特徴
 * - 事前定義質問をすべて消化することを最優先
 * - 深掘りは事前定義質問完了後に一括で行う
 * - follow_up_guide は質問リストに含めない
 *
 * 実ロジックは shared/utils/interview-logic/bulk-mode.ts に純粋関数として切り出し済み
 */
export const bulkModeLogic: InterviewModeLogic = {
  buildSystemPrompt(params: InterviewPromptParams): string {
    return buildBulkModeSystemPrompt(params);
  },

  calculateNextQuestionId(params: NextQuestionParams): string | undefined {
    return calculateBulkModeNextQuestionId(params);
  },
};
