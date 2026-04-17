import "server-only";

import { generateObject } from "ai";
import type { AiModel } from "@/lib/ai/models";
import { LLM_MAX_ATTEMPTS, LLM_TIMEOUT_MS } from "../../shared/constants";
import {
  type OverallEvaluation,
  overallEvaluationSchema,
} from "../../shared/schemas";
import {
  buildOverallEvaluationPrompt,
  type OverallEvaluationSlotInput,
} from "../../shared/utils/build-overall-evaluation-prompt";
import { withTimeoutRetry } from "../../shared/utils/with-timeout-retry";

interface SummarizeOverallEvaluationParams {
  slots: OverallEvaluationSlotInput[];
  model: AiModel;
  traceId: string;
  signal?: AbortSignal;
}

/**
 * 全スロットの満足度評価を横断してインタビュー設定の総合評価を LLM に生成させる。
 * 対象スロットが 0 件なら null を返す。LLM 失敗時も null を返し、スロット個別結果は壊さない。
 */
export async function summarizeOverallEvaluation(
  params: SummarizeOverallEvaluationParams
): Promise<OverallEvaluation | null> {
  const { slots, model, traceId, signal } = params;

  if (slots.length === 0) return null;

  // 満足度が 1 件も付いていなければ評価不能
  if (slots.every((s) => s.satisfaction === null)) return null;

  const prompt = buildOverallEvaluationPrompt({ slots });

  try {
    const { object } = await withTimeoutRetry(
      (attemptSignal) =>
        generateObject({
          model,
          schema: overallEvaluationSchema,
          prompt,
          abortSignal: attemptSignal,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "sim-overall-evaluation",
            metadata: { traceId, slotCount: String(slots.length) },
          },
        }),
      {
        externalSignal: signal,
        timeoutMs: LLM_TIMEOUT_MS.overallEvaluation,
        maxAttempts: LLM_MAX_ATTEMPTS,
        label: "sim-overall-evaluation",
      }
    );
    return object;
  } catch (error) {
    console.warn("[OverallEvaluation] LLM failed", error);
    return null;
  }
}
